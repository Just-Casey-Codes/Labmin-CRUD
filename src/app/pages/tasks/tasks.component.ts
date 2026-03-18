import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/task.model';
import { Observable } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar />
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">Tasks Dashboard</h1>

      <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="mb-8 p-4 bg-white rounded shadow">
        <h2 class="text-xl font-semibold mb-4 text-gray-700">Add New Task</h2>
        
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Title</label>
          <input formControlName="title" type="text" placeholder="Task Title"
                 class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Description</label>
          <textarea formControlName="description" placeholder="Task Description"
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
        </div>

        <button type="submit" [disabled]="!taskForm.valid"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50">
          Add Task
        </button>
      </form>

      <div class="bg-white rounded shadow mb-6">
        <h2 class="text-xl font-semibold p-4 border-b text-gray-700">Your Tasks</h2>
        
        <div *ngIf="(tasks$ | async) as tasks; else loading" class="divide-y">
          <div *ngIf="tasks.length === 0" class="p-4 text-gray-500 text-center">
            No tasks found. Create one above!
          </div>

          <div *ngFor="let task of tasks" class="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 transition-colors">
            
            <div class="mb-2 md:mb-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-lg font-bold text-gray-800">{{ task.title }}</h3>
                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                      [ngClass]="{
                        'bg-yellow-100 text-yellow-800': task.status === 'pending',
                        'bg-blue-100 text-blue-800': task.status === 'in-progress',
                        'bg-green-100 text-green-800': task.status === 'completed'
                      }">
                  {{ task.status | uppercase }}
                </span>
                <span *ngIf="isAdmin" class="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded-full">
                  {{ task.userEmail || 'Unknown User' }}
                </span>
              </div>
              <p class="text-gray-600 mb-1">{{ task.description }}</p>
            </div>

            <div class="flex gap-2">
              <select class="border rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
                      [value]="task.status" (change)="onStatusChange(task.id, $any($event.target).value)">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <button (click)="onDelete(task.id)" class="bg-red-500 hover:bg-red-600 text-white p-2 rounded justify-center items-center flex transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
          </div>
        </div>
        
        <ng-template #loading>
          <div class="p-4 text-gray-500 text-center">Loading tasks...</div>
        </ng-template>
      </div>
    </div>
  `
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  tasks$!: Observable<Task[]>;
  isAdmin = false;

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required]
  });

  ngOnInit() {
    this.tasks$ = this.taskService.getTasks();
    
    const user = this.authService.user();
    if (user?.role === 'admin') {
      this.isAdmin = true;
    }
  }

  async onSubmit() {
    if (this.taskForm.valid) {
      try {
        const currentUser = this.authService.user();
        const newTask = {
          title: this.taskForm.value.title,
          description: this.taskForm.value.description,
          status: 'pending' as const,
          userId: currentUser?.uid || '',
          userEmail: currentUser?.email || ''
        };
        await this.taskService.addTask(newTask);
        this.taskForm.reset();
      } catch (err) {
        console.error('Error adding task:', err);
        alert('Failed to add task. Please try again.');
      }
    }
  }

  async onStatusChange(taskId: string, newStatus: string) {
    try {
      if (['pending', 'in-progress', 'completed'].includes(newStatus)) {
        await this.taskService.updateTask(taskId, { status: newStatus as any });
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task status.');
    }
  }

  async onDelete(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await this.taskService.deleteTask(taskId);
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task.');
      }
    }
  }
}
