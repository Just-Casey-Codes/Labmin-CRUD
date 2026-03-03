import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User, Role } from '../../models/user.model';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  editingUserId = signal<number | null>(null);
  editUsername = signal('');
  editRole = signal('user');

  isAdmin = this.authService.isAdmin;

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => console.error('Failed to load users:', err)
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (err) => console.error('Failed to load roles:', err)
    });
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

  saveEdit(id: number): void {
    const newUsername = this.editUsername().trim();
    if (!newUsername) return;

    this.userService.updateUser(id, {
      username: newUsername,
      role: this.editRole()
    }).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadUsers();
        // If admin edited themselves, refresh session
        const currentUser = this.authService.user();
        if (currentUser && currentUser.id === id) {
          this.authService.refreshCurrentUser();
        }
      },
      error: (err) => console.error('Failed to update user:', err)
    });
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error('Failed to delete user:', err)
      });
    }
  }
}
