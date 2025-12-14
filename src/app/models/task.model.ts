export interface Task {
  id: number;
  title: string;
  links: string[];
  completed: boolean;
  createdAt: Date;
}
