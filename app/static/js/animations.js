// Animation utilities for Yara AI Assistant

class AnimationManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
    }
    
    setupScrollAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe elements with animation class
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
    
    setupHoverEffects() {
        // Add hover effects to buttons
        document.querySelectorAll('button').forEach(button => {
            if (!button.classList.contains('no-hover')) {
                button.addEventListener('mouseenter', () => {
                    button.classList.add('transform', 'scale-105');
                });
                
                button.addEventListener('mouseleave', () => {
                    button.classList.remove('transform', 'scale-105');
                });
            }
        });
    }
    
    setupLoadingAnimations() {
        // Add CSS animations dynamically
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fade-in-up {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .animate-fade-in-up {
                animation: fade-in-up 0.6s ease-out forwards;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .animate-float {
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes pulse-color {
                0%, 100% { background-color: rgb(59, 130, 246); }
                50% { background-color: rgb(139, 92, 246); }
            }
            
            .animate-pulse-color {
                animation: pulse-color 2s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    pulseElement(element, duration = 1000) {
        element.classList.add('animate-pulse');
        setTimeout(() => {
            element.classList.remove('animate-pulse');
        }, duration);
    }
    
    glowElement(element, duration = 2000) {
        element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
        setTimeout(() => {
            element.style.boxShadow = '';
        }, duration);
    }
    
    shakeElement(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
        
        // Add shake keyframes if not already present
        if (!document.querySelector('#shake-animation')) {
            const shakeStyle = document.createElement('style');
            shakeStyle.id = 'shake-animation';
            shakeStyle.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(shakeStyle);
        }
    }
    
    bounceElement(element) {
        element.classList.add('animate-bounce');
        setTimeout(() => {
            element.classList.remove('animate-bounce');
        }, 1000);
    }
    
    typewriterEffect(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, speed);
    }
    
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let opacity = 0;
        const increment = 50 / duration;
        
        const fadeInterval = setInterval(() => {
            opacity += increment;
            if (opacity >= 1) {
                opacity = 1;
                clearInterval(fadeInterval);
            }
            element.style.opacity = opacity;
        }, 50);
    }
    
    fadeOut(element, duration = 300) {
        let opacity = 1;
        const decrement = 50 / duration;
        
        const fadeInterval = setInterval(() => {
            opacity -= decrement;
            if (opacity <= 0) {
                opacity = 0;
                element.style.display = 'none';
                clearInterval(fadeInterval);
            }
            element.style.opacity = opacity;
        }, 50);
    }
    
    slideIn(element, direction = 'left', duration = 300) {
        const translations = {
            'left': 'translateX(-100%)',
            'right': 'translateX(100%)',
            'up': 'translateY(-100%)',
            'down': 'translateY(100%)'
        };
        
        element.style.transform = translations[direction];
        element.style.display = 'block';
        element.style.transition = `transform ${duration}ms ease-out`;
        
        setTimeout(() => {
            element.style.transform = 'translate(0, 0)';
        }, 10);
    }
    
    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        element.appendChild(ripple);
        
        // Add ripple styles if not present
        if (!document.querySelector('#ripple-styles')) {
            const rippleStyles = document.createElement('style');
            rippleStyles.id = 'ripple-styles';
            rippleStyles.textContent = `
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(0);
                    animation: ripple-animation 0.6s linear;
                    pointer-events: none;
                }
                
                @keyframes ripple-animation {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(rippleStyles);
        }
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Initialize animation manager
document.addEventListener('DOMContentLoaded', () => {
    window.animationManager = new AnimationManager();
    
    // Add ripple effect to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            if (!button.classList.contains('no-ripple')) {
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                window.animationManager.createRippleEffect(button, e);
            }
        });
    });
});