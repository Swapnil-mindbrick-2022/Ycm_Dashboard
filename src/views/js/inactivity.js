let logoutTimer;

function resetLogoutTimer(){
  clearTimeout(logoutTimer);
  logoutTimer = setTimeout(logout, 10 * 60 * 1000); // 10 minutes in milliseconds
}

function logout() {
  // Perform the logout action, e.g., send a logout request to the server
  // Redirect the user to the login page or perform any other necessary actions
  window.location.href = '/logout'; // Redirect to logout URL
}

// Start the timer when the page loads
resetLogoutTimer();

// Listen for user activity events and reset the timer
document.addEventListener('mousemove', resetLogoutTimer);
document.addEventListener('mousedown', resetLogoutTimer);
document.addEventListener('keypress', resetLogoutTimer);
console.log('inactivity has been accessed...')