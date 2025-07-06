document.addEventListener('DOMContentLoaded', () => {
    // ========== PARTICULES ==========
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            if (mouse.x != null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    this.x += (dx / distance) * force * 2;
                    this.y += (dy / distance) * force * 2;
                }
            }

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

    function initParticles() {
        particles = Array.from({ length: 100 }, () => new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 80) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(74, 144, 226, ${0.8 - distance/80})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        requestAnimationFrame(animate);
    }

    function setupCanvas() {
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
        window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
    }

    setupCanvas();
    initParticles();
    animate();

    // ========== AUTH ==========
    const auth = {
        async login(username, password) {
            try {
                const res = await fetch('http://localhost:5000/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('username', username);
                    window.location.href = 'app.html';
                } else {
                    throw new Error(data.error || 'Erreur de connexion');
                }
            } catch (err) {
                alert(err.message);
                console.error(err);
            }
        },

        async register(username, password) {
            try {
                const res = await fetch('http://localhost:5000/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Inscription réussie ! Vous pouvez vous connecter.');
                    window.location.href = 'index.html';
                } else {
                    throw new Error(data.error || 'Erreur d\'inscription');
                }
            } catch (err) {
                alert(err.message);
                console.error(err);
            }
        }
    };

    // Gestion des formulaires
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const username = loginForm.querySelector('[name="username"]').value;
            const password = loginForm.querySelector('[name="password"]').value;
            auth.login(username, password);
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const username = registerForm.querySelector('[name="username"]').value;
            const password = registerForm.querySelector('[name="password"]').value;
            auth.register(username, password);
        });
    }

    // ========== PAGE APP ==========
    async function saveTimeToServer(startISO, endISO, duration) {
        const username = localStorage.getItem('username');
        if (!username) return;
        try {
            await fetch('http://localhost:5000/times/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, start: startISO, end: endISO, duration })
            });
        } catch (err) {
            console.error('Erreur lors de l\'envoi des temps:', err);
        }
    }

    class Chronometer {
        constructor(display) {
            this.display = display;
            this.startTime = 0;
            this.isRunning = false;
            this.interval = null;
        }

        start() {
            if (!this.isRunning) {
                this.startTime = Date.now() - (this.startTime ? Date.now() - this.startTime : 0);
                this.interval = setInterval(() => this.update(), 10);
                this.isRunning = true;
            }
        }

        stop() {
            if (this.isRunning) {
                clearInterval(this.interval);
                this.isRunning = false;

                const endISO = new Date().toISOString();
                const durationMs = Date.now() - this.startTime;
                const startISO = new Date(Date.now() - durationMs).toISOString();

                saveTimeToServer(startISO, endISO, durationMs);
            }
        }

        reset() {
            this.stop();
            this.startTime = 0;
            this.display.textContent = "00:00:00";
        }

        update() {
            const time = Date.now() - this.startTime;
            const hours = Math.floor(time / 3600000);
            const minutes = Math.floor((time % 3600000) / 60000);
            const seconds = Math.floor((time % 60000) / 1000);
            this.display.textContent = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
        }

        pad(num) {
            return num.toString().padStart(2, '0');
        }
    }

    // === INIT APP PAGE ===
    const app = document.getElementById('chrono-section');
    if (app) {
        const elements = {
            startBtn: document.getElementById('start-btn'),
            stopBtn: document.getElementById('stop-btn'),
            resetBtn: document.getElementById('reset-btn'),
            showChrono: document.getElementById('show-chrono'),
            showHistorique: document.getElementById('show-historique'),
            chronoSection: document.getElementById('chrono-section'),
            historiqueSection: document.getElementById('historique-section'),
            chronoDisplay: document.getElementById('chrono-display'),
            logoutBtn: document.getElementById('logout-btn'),
            welcomeMessage: document.getElementById('welcome-message')
        };

        const chrono = new Chronometer(elements.chronoDisplay);

        elements.startBtn.addEventListener('click', () => {
            chrono.start();
            elements.startBtn.disabled = true;
            elements.stopBtn.disabled = false;
        });

        elements.stopBtn.addEventListener('click', () => {
            chrono.stop();
            elements.startBtn.disabled = false;
            elements.stopBtn.disabled = true;
        });

        elements.resetBtn.addEventListener('click', () => {
            chrono.reset();
            elements.startBtn.disabled = false;
            elements.stopBtn.disabled = true;
        });

        elements.showChrono.addEventListener('click', () => {
            elements.chronoSection.style.display = 'block';
            elements.historiqueSection.style.display = 'none';
            elements.showChrono.classList.add('active-btn');
            elements.showHistorique.classList.remove('active-btn');
        });

        elements.showHistorique.addEventListener('click', () => {
            elements.chronoSection.style.display = 'none';
            elements.historiqueSection.style.display = 'block';
            elements.showHistorique.classList.add('active-btn');
            elements.showChrono.classList.remove('active-btn');
        });

        elements.logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        });

        const username = localStorage.getItem('username');
        if (username && elements.welcomeMessage) {
            elements.welcomeMessage.textContent = `Bienvenue ${username} !`;
        }

        // HISTORIQUE
        const loadHistoriqueBtn = document.getElementById('load-historique');
        const historiqueList = document.getElementById('historique-list');

        if (loadHistoriqueBtn && historiqueList) {
            loadHistoriqueBtn.addEventListener('click', async () => {
                try {
                    const res = await fetch('http://localhost:5000/times/all');
                    const data = await res.json();
                    historiqueList.innerHTML = '';

                    data.forEach(user => {
                        const userDiv = document.createElement('div');
                        userDiv.classList.add('user-item');

                        let html = `<h3>${user.username}</h3>`;
                        if (user.times && user.times.length > 0) {
                            html += '<ul>';
                            user.times.forEach(t => {
                                const startDate = new Date(t.start).toLocaleString('fr-FR');
                                const endDate = new Date(t.end).toLocaleString('fr-FR');

                                let duration = t.duration;
                                const h = Math.floor(duration / 3600000);
                                duration %= 3600000;
                                const m = Math.floor(duration / 60000);
                                duration %= 60000;
                                const s = Math.floor(duration / 1000);

                                let durationStr = '';
                                if (h > 0) durationStr += `${h} h `;
                                if (m > 0) durationStr += `${m} min `;
                                durationStr += `${s} sec`;

                                html += `
                                    <li>
                                        <strong>Début :</strong> ${startDate}<br>
                                        <strong>Fin :</strong> ${endDate}<br>
                                        <strong>Durée :</strong> ${durationStr}
                                    </li>`;
                            });
                            html += '</ul>';
                        } else {
                            html += '<p>Aucun temps enregistré</p>';
                        }

                        userDiv.innerHTML = html;
                        historiqueList.appendChild(userDiv);
                    });
                } catch (err) {
                    console.error(err);
                    alert('Erreur lors du chargement de l\'historique');
                }
            });
        }
    }
});

