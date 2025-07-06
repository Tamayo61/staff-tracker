
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1; // Particules un peu plus petites
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = Math.random() * 30 + 1;
            this.speedX = Math.random() * 0.5 - 0.25; // Vitesse réduite
            this.speedY = Math.random() * 0.5 - 0.25; // Vitesse réduite
        }

        update() {
            // Position de base + mouvement lent
            this.x += this.speedX;
            this.y += this.speedY;

            // Rebond sur les bords
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            // Effet de suivi de la souris
            if (mouse.x != null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = 150;
                const force = (maxDistance - distance) / maxDistance;

                if (distance < maxDistance) {
                    this.x += forceDirectionX * force * 2; // Force d'attraction
                    this.y += forceDirectionY * force * 2;
                }
            }

            // Retour progressif à la position d'origine
            const dx = this.baseX - this.x;
            const dy = this.baseY - this.y;
            this.x += dx * 0.01;
            this.y += dy * 0.01;
        }

        draw() {
            ctx.fillStyle = '#4a90e2';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < 150; i++) { // Plus de particules pour un meilleur effet
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connexion entre les particules
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 80) { // Distance réduite pour les connexions
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(74, 144, 226, ${0.8 - distance/80})`; // Opacité augmentée
                    ctx.lineWidth = 0.5; // Lignes plus fines
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    const loginForm = document.querySelector('.login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log('Tentative de connexion:', { username, password });
    });

    init();
    animate();
});