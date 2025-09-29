// Handle form submission
document.getElementById("contactForm").addEventListener("submit", function(e) {
  e.preventDefault();
  alert("✅ Message sent successfully!");
  this.reset();
});

// Copy email to clipboard
document.getElementById("emailCircle").addEventListener("click", function() {
  navigator.clipboard.writeText("joshstringz94@gmail.com").then(() => {
    alert("📋 Email copied to clipboard!");
  });
});

// Copy phone number to clipboard
document.getElementById("phoneCircle").addEventListener("click", function() {
  navigator.clipboard.writeText("08023012458").then(() => {
    alert("📞 Phone number copied to clipboard!");
  });
});

