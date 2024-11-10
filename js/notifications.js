// Notification System Class
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notifications = new Map();
    }

    // Display a new notification
    show(message, type = 'info', duration = 3000) {
        const id = Date.now().toString();
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Create notification elements
        const icon = this.createIcon(type);
        const content = this.createContent(message);
        const closeBtn = this.createCloseButton(id);
        const progress = this.createProgressBar(type);
        
        // Assemble notification
        notification.appendChild(icon);
        notification.appendChild(content);
        notification.appendChild(closeBtn);
        notification.appendChild(progress);
        
        this.container.appendChild(notification);
        
        // Set removal timer
        setTimeout(() => this.remove(id), duration);
        
        // Store notification reference
        this.notifications.set(id, {
            element: notification,
            duration
        });
        
        this.updateProgress(id);
        
        return id;
    }

    // Remove a notification
    remove(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.element.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            setTimeout(() => {
                notification.element.remove();
                this.notifications.delete(id);
            }, 300);
        }
    }
    
    // Update progress bar
    updateProgress(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            const progress = notification.element.querySelector('.notification-progress');
            const startTime = Date.now();
            
            const update = () => {
                const elapsed = Date.now() - startTime;
                const percent = 100 - (elapsed / notification.duration * 100);
                
                if (percent > 0) {
                    progress.style.width = `${percent}%`;
                    requestAnimationFrame(update);
                }
            };
            
            requestAnimationFrame(update);
        }
    }

    // Helper methods for creating notification elements
    createIcon(type) {
        const icon = document.createElement('i');
        switch(type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                icon.style.color = 'var(--success-color, #4caf50)';
                break;
            case 'error':
                icon.className = 'fas fa-times-circle';
                icon.style.color = 'var(--error-color, #f44336)';
                break;
            case 'info':
            default:
                icon.className = 'fas fa-info-circle';
                icon.style.color = 'var(--info-color, #2196f3)';
                break;
        }
        return icon;
    }

    createContent(message) {
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = message;
        return content;
    }

    createCloseButton(id) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onclick = () => this.remove(id);
        return closeBtn;
    }

    createProgressBar(type) {
        const progress = document.createElement('div');
        progress.className = 'notification-progress';
        switch(type) {
            case 'success':
                progress.style.background = 'var(--success-color, #4caf50)';
                break;
            case 'error':
                progress.style.background = 'var(--error-color, #f44336)';
                break;
            case 'info':
            default:
                progress.style.background = 'var(--info-color, #2196f3)';
                break;
        }
        return progress;
    }
}

// Initialize the notification system
const notifications = new NotificationSystem();