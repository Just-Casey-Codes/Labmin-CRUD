import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  templateUrl: './users.component.html'
})
export class UsersComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  users = signal<User[]>([]);
  editingUserId = signal<string | null>(null);
  editUsername = signal('');
  editRole = signal<'admin' | 'user'>('user');

  isAdmin = this.authService.isAdmin;

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.users.set(this.userService.getUsers());
  }

  startEdit(user: User): void {
    this.editingUserId.set(user.id);
    this.editUsername.set(user.username);
    this.editRole.set(user.role);
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
    this.editUsername.set('');
    this.editRole.set('user');
  }

  saveEdit(id: string): void {
    const newUsername = this.editUsername().trim();
    if (!newUsername) return;

    this.userService.updateUser(id, {
      username: newUsername,
      role: this.editRole()
    });
    this.cancelEdit();
    this.loadUsers();
    this.authService.refreshCurrentUser();
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id);
      this.loadUsers();
    }
  }
}
