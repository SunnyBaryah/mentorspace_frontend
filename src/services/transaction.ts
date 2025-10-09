import axios from "../axios.ts";
export class TransactionService {
  async createOrder(obj: {
    amount: number;
    studentId: string;
    teacherId: string;
    batchId: string;
  }) {
    const response = await axios.post(`/transaction/create-order`, obj);
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while creating order");
    }
  }

  async verifyPayment(obj: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    transactionId: string;
  }) {
    const response = await axios.post(`/transaction/verify-payment`, obj);
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while verifying payment");
    }
  }

  async initiateTeacherPayout(obj: { transactionId: string }) {
    const response = await axios.post(
      `/transaction/initiate-teacher-payout`,
      obj
    );
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while initiating teacher payout");
    }
  }
  async cancelOrder(obj: { transactionId: string }) {
    const response = await axios.post(`/transaction/cancel-order`, obj);
    if (response.status === 200) {
      return response;
    } else {
      console.log("Error while initiating teacher payout");
    }
  }
}
const transactionService = new TransactionService();

export default transactionService;
