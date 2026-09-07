declare module '@paystack/inline-js' {
  export default class PaystackPop {
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      metadata?: Record<string, any>;
      onSuccess?: (transaction: { reference: string; [key: string]: any }) => void;
      onCancel?: () => void;
      onError?: (error: { message: string }) => void;
      [key: string]: any;
    }): void;
    checkout(options: Record<string, any>): void;
    resumeTransaction(accessCode: string): void;
  }
}