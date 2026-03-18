export interface Task {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
}