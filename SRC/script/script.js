const menu = document.querySelector('#menu-icon-js');
const menuIcon = document.querySelector('#menu-icon');
const navbar = document.querySelector('.navbar');
const navOverlay = document.querySelector('#nav-tc-js');
const navLinks = document.querySelectorAll('.navbar a');

if (menu && menuIcon && navbar) {
  menu.addEventListener('click', () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('open');
    navOverlay?.classList.toggle('nav-touch-close-open');
  });
}

if (navOverlay) {
  navOverlay.addEventListener('click', () => {
    menuIcon?.classList.remove('bx-x');
    navbar?.classList.remove('open');
    navOverlay.classList.remove('nav-touch-close-open');
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (navbar.classList.contains('open')) {
      navbar.classList.remove('open');
      menuIcon?.classList.remove('bx-x');
      navOverlay?.classList.remove('nav-touch-close-open');
    }
  });
});

/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
let prevScrollpos = window.pageYOffset;
window.onscroll = function () {
	var currentScrollPos = window.pageYOffset;

	document.getElementById("header").classList.add('scrolled');
	if (currentScrollPos === 0) {
		document.getElementById("header").classList.remove('scrolled');
	}
	if (navtc.classList.contains('nav-touch-close-open')) {
		return;
	}
	if (prevScrollpos > currentScrollPos) {
		document.getElementById("header").style.top = "0";
	} else {
		document.getElementById("header").style.top = "-100px";
	}
	prevScrollpos = currentScrollPos;
}

	// Backend base URL: use the local backend server directly for contact submissions.
	const BACKEND_BASE = 'http://localhost:3000';


const contactSection = document.querySelector('.contact-section');
const formSection = document.querySelector('.form-section');
const contactSubmitAfter = document.querySelector('.contact-submit-after');
const csaOK = document.querySelector('.csa-ok');


const contactForm = document.querySelector('.contact-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');
const errorDiv = document.querySelector('.error');
const emailErrorDiv = document.querySelector('.email-error');
const contactButton = document.querySelector('.contact-button');
const contactLoad = document.querySelector('.contact-load');
const submitText = document.querySelector('.submit-text');

if (csaOK) {
	csaOK.onclick = () => {
		contactSubmitAfter.classList.remove('show');
		formSection.classList.remove('hide');
		contactSection.classList.remove('csa-cs');
		contactForm.classList.remove('csa-cf');
		contactButton.classList.remove('loading');
		contactLoad.classList.remove('show');
		submitText.classList.remove('hide');
	}
}

// Function to validate the form
function validateForm(event) {
	event.preventDefault(); // Prevent the form from submitting
	let isValid = true;
	let emailIsValid = true;
	let nameIsValid = true;
	let messageIsValid = true;

	// Check if Name field is empty
	if (nameInput.value.trim() === '') {
		isValid = false;
		nameIsValid = false;
	}

	// Check if Email field is empty or not a valid email address
	if (emailInput.value.trim() === '' || !isValidEmail(emailInput.value)) {
		isValid = false;
		if (emailInput.value.trim() !== '' && !isValidEmail(emailInput.value)) {
			emailIsValid = false;
		}
	}

	// Check if Message field is empty
	if (messageInput.value.trim() === '') {
		isValid = false;
		messageIsValid = false;
	}

	if (!isValid) {
		// Display the error message
		errorDiv.classList.add('error-show');
		emailErrorDiv.classList.remove('error-show');
		if (nameIsValid && messageIsValid && !emailIsValid) {
			errorDiv.classList.remove('error-show');
			emailErrorDiv.classList.add('error-show');
		}
	} else {
		// Form is valid, show loading and send
		emailErrorDiv.classList.remove('error-show');
		errorDiv.classList.remove('error-show');
		contactButton.classList.add('loading');
		contactLoad.classList.add('show');
		submitText.classList.add('hide');
		setTimeout(function () {
			sendMail();
		}, 2000);
	}
}

// Function to validate email format using a regular expression
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Event listener for form submission
if (contactForm) {
	contactForm.addEventListener('submit', validateForm);
}

// Send form data to Node.js backend
function sendMail() {
	const data = {
		name:    nameInput.value.trim(),
		email:   emailInput.value.trim(),
		message: messageInput.value.trim()
	};

	fetch(`${BACKEND_BASE}/contact`, {
		method:  'POST',
		headers: { 'Content-Type': 'application/json' },
		body:    JSON.stringify(data)
	})
	.then(async response => {
		const result = await response.json();
		console.log('Server response:', result);
		if (!response.ok || result.success !== true) {
			console.error('Contact submit failed:', result);
			contactButton.classList.remove('loading');
			contactLoad.classList.remove('show');
			submitText.classList.remove('hide');
			errorDiv.textContent = '⚠ ' + (result.error || 'Something went wrong. Please try again.');
			errorDiv.classList.add('error-show');
			return;
		}

		console.log('✅ Server verified inserted row:', result.inserted);
		console.log('Message saved was:', result.inserted?.message);

		// Clear the form fields
		nameInput.value    = '';
		emailInput.value   = '';
		messageInput.value = '';

		// Show the success box (uses your existing CSS animation)
		contactSubmitAfter.classList.add('show');
		formSection.classList.add('hide');
		contactSection.classList.add('csa-cs');
		contactForm.classList.add('csa-cf');
	})
	.catch(err => {
		// Network error — server might not be running
		console.error('Connection error:', err);
		contactButton.classList.remove('loading');
		contactLoad.classList.remove('show');
		submitText.classList.remove('hide');
		errorDiv.innerHTML = '<i class="fa-solid fa-circle-xmark error-icon"></i> Could not connect to server. Make sure the backend is running.';
		errorDiv.classList.add('error-show');
	});
}

function renderMessages(messages) {
	const list = document.getElementById('message-list');
	if (!list) return;

	if (!messages || messages.length === 0) {
		list.innerHTML = '<div class="empty-message-list">No messages found yet.</div>';
		return;
	}

	list.innerHTML = messages.map(msg => {
		const timestamp = msg.submitted_at || msg.created_at || null;
		const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : 'Date not available';

		return `
			<div class="message-card">
				<div class="message-header">
					<strong>${msg.name}</strong> • <a href="mailto:${msg.email}">${msg.email}</a>
				</div>
				<div class="message-body">${msg.message.replace(/\n/g, '<br>')}</div>
				<div class="message-meta">${formattedTime}</div>
			</div>
		`;
	}).join('');
}


