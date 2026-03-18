import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Observable, switchMap, of, map } from 'rxjs';
import { Task } from '../models/task.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private tasksCollection = collection(this.firestore, 'tasks');


  getTasks(): Observable<Task[]> {
    const user = this.authService.user();
    
    if (!user) return of([]);

    if (user.role === 'admin') {
      return collectionData(this.tasksCollection, { idField: 'id' }) as Observable<Task[]>;
    } else {
      const userTasksQuery = query(this.tasksCollection, where('userId', '==', user.uid));
      return collectionData(userTasksQuery, { idField: 'id' }) as Observable<Task[]>;
    }
  }

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<any> {
    const user = this.authService.user();
    if (!user) throw new Error('Must be logged in to add a task');

    return addDoc(this.tasksCollection, {
      ...task,
      userId: user.uid,
      userEmail: user.email,   
      createdAt: new Date()
    });
  }

  updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskDocRef = doc(this.firestore, `tasks/${taskId}`);
    return updateDoc(taskDocRef, updates as any);
  }

  deleteTask(taskId: string): Promise<void> {
    const taskDocRef = doc(this.firestore, `tasks/${taskId}`);
    return deleteDoc(taskDocRef);
  }
}
