function handleSignup(event) {
      event.preventDefault();
      
      const emailInput = event.target.querySelector('input[type="email"]');
      const email = emailInput.value;
      
      alert('Thank you for signing up! We will contact you shortly at ' + email + ' with details about the early access beta.');
      
      emailInput.value = '';
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });