export interface Teacher {
  _id: string;
  username: string;
  email: string;
  password: string;
  description: string;
  subjects: string[];
  batches: { name: string; batch_id: string }[];
  upi_id: string;
  refreshToken: string;
}
