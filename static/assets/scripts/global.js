const Toast = Swal.mixin({
  toast: true,
  position: 'bottom',
  showConfirmButton: false,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

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
const socket = io(EULER_URL, {
  transports: ['websocket']
})

socket.on('connect', () => {
  if (typeof TEAM_UUID !== 'undefined') {
    // user is logged in, join room
    socket.emit('join', TEAM_UUID)
  }
})

socket.on('disconnect', () => {
  Toast.fire({
    icon: 'error',
    title: `Disconnected from the communications engine, attempting to reconnect...`,
    timer: 5000
  })
})

socket.on('announcement', (id) => {
  Toast.fire({
    icon: 'info',
    title: `<p>We just posted a new announcement. <a href="/announcements/${id}">Click here to view</a>.</p>`,
    timer: 5000
  })
})

socket.on('refresh', () => {
  console.log("Received refresh intent")
  const timeToRefresh = Math.floor(Math.random() * Math.floor(10)) + 10 // stagger refresh time to prevent traffic surge

  Toast.fire({
    icon: 'warning',
    title: `We've updated our servers and potentially squashed a few bugs. Your current page will be refreshed in ${timeToRefresh} seconds.`,
    timer: timeToRefresh * 1000 - 1000
  })

  setTimeout(() => {
    window.location.reload()
  }, timeToRefresh * 1000)
})

socket.on('alert', (content) => {
  Swal.fire('Alert!', content, 'warning')
})
