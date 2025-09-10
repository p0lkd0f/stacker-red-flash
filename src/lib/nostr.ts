import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools/pure';
import { SimplePool } from 'nostr-tools/pool';
import { nip04, nip19 } from 'nostr-tools';

export interface NostrUser {
  pubkey: string;
  npub: string;
  secretKey?: Uint8Array;
  lightningAddress?: string;
  nwcUri?: string;
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface ZapRequest {
  amount: number;
  comment?: string;
  recipient: string;
  postId?: string;
}

export interface Invoice {
  paymentRequest: string;
  paymentHash: string;
  amount: number;
  description: string;
  expiresAt: number;
  paid: boolean;
}

class NostrService {
  private pool: SimplePool;
  private relays: string[];
  private currentUser: NostrUser | null = null;

  constructor() {
    this.pool = new SimplePool();
    this.relays = [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.snort.social',
      'wss://relay.nostr.band'
    ];
  }

  // Generate new Nostr keypair
  generateKeypair(): NostrUser {
    const secretKey = generateSecretKey();
    const pubkey = getPublicKey(secretKey);
    const npub = nip19.npubEncode(pubkey);
    
    return {
      pubkey,
      npub,
      secretKey
    };
  }

  // Login with existing secret key
  loginWithSecretKey(secretKey: string): NostrUser {
    let sk: Uint8Array;
    
    try {
      // Try to decode as nsec
      const decoded = nip19.decode(secretKey);
      if (decoded.type === 'nsec') {
        sk = decoded.data;
      } else {
        throw new Error('Invalid nsec format');
      }
    } catch {
      // Try as hex
      sk = new Uint8Array(secretKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    }
    
    const pubkey = getPublicKey(sk);
    const npub = nip19.npubEncode(pubkey);
    
    const user: NostrUser = {
      pubkey,
      npub,
      secretKey: sk
    };
    
    this.currentUser = user;
    this.saveUserToStorage(user);
    
    return user;
  }

  // Get current user
  getCurrentUser(): NostrUser | null {
    if (!this.currentUser) {
      this.currentUser = this.loadUserFromStorage();
    }
    return this.currentUser;
  }

  // Save user to localStorage
  private saveUserToStorage(user: NostrUser) {
    const userData = {
      pubkey: user.pubkey,
      npub: user.npub,
      secretKey: user.secretKey ? Array.from(user.secretKey) : undefined,
      lightningAddress: user.lightningAddress,
      nwcUri: user.nwcUri
    };
    localStorage.setItem('nostr_user', JSON.stringify(userData));
  }

  // Load user from localStorage
  private loadUserFromStorage(): NostrUser | null {
    try {
      const userData = localStorage.getItem('nostr_user');
      if (!userData) return null;
      
      const parsed = JSON.parse(userData);
      return {
        pubkey: parsed.pubkey,
        npub: parsed.npub,
        secretKey: parsed.secretKey ? new Uint8Array(parsed.secretKey) : undefined,
        lightningAddress: parsed.lightningAddress,
        nwcUri: parsed.nwcUri
      };
    } catch {
      return null;
    }
  }

  // Update user profile
  async updateProfile(profile: { lightningAddress?: string; nwcUri?: string }) {
    if (!this.currentUser) throw new Error('No user logged in');
    
    this.currentUser = {
      ...this.currentUser,
      ...profile
    };
    
    this.saveUserToStorage(this.currentUser);
    
    // Publish profile update to Nostr
    if (this.currentUser.secretKey) {
      const profileEvent = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({
          lud16: profile.lightningAddress,
          nwc: profile.nwcUri
        }),
        pubkey: this.currentUser.pubkey
      };
      
      const signedEvent = finalizeEvent(profileEvent, this.currentUser.secretKey);
      await this.publishEvent(signedEvent);
    }
  }

  // Publish event to relays
  async publishEvent(event: NostrEvent): Promise<void> {
    const promises = this.relays.map(relay => 
      this.pool.publish([relay], event)
    );
    
    await Promise.allSettled(promises);
  }

  // Create zap request
  async createZapRequest(zapRequest: ZapRequest): Promise<Invoice> {
    if (!this.currentUser) throw new Error('No user logged in');
    
    const { amount, comment, recipient, postId } = zapRequest;
    
    // Create zap request event (kind 9734)
    const zapRequestEvent = {
      kind: 9734,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', recipient],
        ['amount', (amount * 1000).toString()], // Convert to millisats
        ...(postId ? [['e', postId]] : []),
        ['relays', ...this.relays]
      ],
      content: comment || '',
      pubkey: this.currentUser.pubkey
    };
    
    if (!this.currentUser.secretKey) {
      throw new Error('Secret key required for zapping');
    }
    
    const signedZapRequest = finalizeEvent(zapRequestEvent, this.currentUser.secretKey);
    
    // Get recipient's lightning address
    const recipientProfile = await this.getUserProfile(recipient);
    if (!recipientProfile?.lud16) {
      throw new Error('Recipient has no lightning address');
    }
    
    // Fetch invoice from LNURL
    const invoice = await this.fetchInvoiceFromLNURL(
      recipientProfile.lud16,
      amount,
      signedZapRequest
    );
    
    return invoice;
  }

  // Fetch invoice from LNURL
  private async fetchInvoiceFromLNURL(
    lightningAddress: string,
    amount: number,
    zapRequest: NostrEvent
  ): Promise<Invoice> {
    const [name, domain] = lightningAddress.split('@');
    const lnurlp = `https://${domain}/.well-known/lnurlp/${name}`;
    
    const response = await fetch(lnurlp);
    const data = await response.json();
    
    if (!data.callback) {
      throw new Error('Invalid LNURL response');
    }
    
    const amountMsat = amount * 1000;
    const callbackUrl = new URL(data.callback);
    callbackUrl.searchParams.set('amount', amountMsat.toString());
    callbackUrl.searchParams.set('nostr', JSON.stringify(zapRequest));
    
    const invoiceResponse = await fetch(callbackUrl.toString());
    const invoiceData = await invoiceResponse.json();
    
    if (!invoiceData.pr) {
      throw new Error('Failed to get invoice');
    }
    
    return {
      paymentRequest: invoiceData.pr,
      paymentHash: this.extractPaymentHash(invoiceData.pr),
      amount,
      description: zapRequest.content,
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
      paid: false
    };
  }

  // Extract payment hash from bolt11 invoice
  private extractPaymentHash(bolt11: string): string {
    // Simple extraction - in production, use a proper bolt11 decoder
    const match = bolt11.match(/lnbc\d+[munp]?1[02-9ac-hj-np-z]+/);
    return match ? match[0] : '';
  }

  // Get user profile
  async getUserProfile(pubkey: string): Promise<any> {
    const events = await this.pool.querySync(this.relays, {
      kinds: [0],
      authors: [pubkey],
      limit: 1
    });
    
    if (events.length === 0) return null;
    
    try {
      return JSON.parse(events[0].content);
    } catch {
      return null;
    }
  }

  // Pay invoice using NWC
  async payInvoice(invoice: Invoice): Promise<boolean> {
    if (!this.currentUser?.nwcUri) {
      throw new Error('No NWC connection configured');
    }
    
    try {
      // Use the existing NWC client from your lib/nwc.ts
      const { getLNClient } = await import('./nwc');
      const ln = getLNClient();
      
      if (!ln) {
        throw new Error('NWC client not available');
      }
      
      await ln.pay(invoice.paymentRequest);
      return true;
    } catch (error) {
      console.error('Payment failed:', error);
      return false;
    }
  }

  // Listen for zap receipts
  async listenForZapReceipts(callback: (zap: any) => void) {
    if (!this.currentUser) return;
    
    const sub = this.pool.subscribeMany(this.relays, [
      {
        kinds: [9735], // Zap receipt
        '#p': [this.currentUser.pubkey]
      }
    ], {
      onevent: (event) => {
        try {
          const zapReceipt = this.parseZapReceipt(event);
          callback(zapReceipt);
        } catch (error) {
          console.error('Error parsing zap receipt:', error);
        }
      }
    });
    
    return () => sub.close();
  }

  // Parse zap receipt
  private parseZapReceipt(event: NostrEvent) {
    const bolt11Tag = event.tags.find(tag => tag[0] === 'bolt11');
    const descriptionTag = event.tags.find(tag => tag[0] === 'description');
    
    if (!bolt11Tag || !descriptionTag) {
      throw new Error('Invalid zap receipt');
    }
    
    const zapRequest = JSON.parse(descriptionTag[1]);
    const amount = parseInt(zapRequest.tags.find((tag: string[]) => tag[0] === 'amount')?.[1] || '0') / 1000;
    
    return {
      amount,
      sender: zapRequest.pubkey,
      recipient: event.pubkey,
      comment: zapRequest.content,
      timestamp: event.created_at,
      bolt11: bolt11Tag[1]
    };
  }

  // Logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('nostr_user');
  }

  // Close connections
  close() {
    this.pool.close(this.relays);
  }
}

export const nostrService = new NostrService();