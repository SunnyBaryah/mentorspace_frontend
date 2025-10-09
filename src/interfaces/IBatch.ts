interface TeacherInfo {
  username?: string;
  email?: string;
  _id?: string;
}

export interface Batch {
  _id: string;
  name: string;
  description: string;
  topics?: { name: string }[];
  price: number;
  start_date: string;
  end_date: string;
  lessons?: { id: number }[];
  teacher_name?: string;
  teacher_id?: string;
  teacher: string | TeacherInfo;
}
