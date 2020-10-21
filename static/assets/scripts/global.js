document.addEventListener('DOMContentLoaded', () => {
  const $navbarBurgers = Array.prototype.slice.call(
    document.querySelectorAll('.navbar-burger'),
    0
  )

  if ($navbarBurgers.length > 0) {
    $navbarBurgers.forEach((el) => {
      el.addEventListener('click', () => {
        const target = el.dataset.target
        const $target = document.getElementById(target)

        el.classList.toggle('is-active')
        $target.classList.toggle('is-active')
      })
    })
  }
})

// socket.io announcements
const socket = io();
const statusEl = document.getElementById("socket-status")

socket.on('connect', () => {
  statusEl.classList.remove('is-warning')
  statusEl.classList.add('is-success')
  statusEl.innerText = "Connected"

  console.log("Connected to the announcements engine!")
})

socket.on('disconnect', () => {
  statusEl.classList.add('is-warning')
  statusEl.classList.remove('is-success')
  statusEl.innerText = "Attempting to Reconnect..."

  console.log("Disconnected from the announcements engine. Attempting to reconnect...")
})

socket.on('announcement', (id) => {
  statusEl.classList.add('alerted')
  statusEl.innerText = "New Announcement, Click to View"
  statusEl.addEventListener('click',() => {
    window.location.href = '/announcements/' + id
  })
})