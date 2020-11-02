const solveBtn = document.getElementById('solveButton')
const solutionBox = document.getElementById('solution')

const solve = (e) => {
  e.preventDefault()
  const csrfToken = document.getElementById('csrfToken').value
  const solution = solutionBox.value

  if (solution == null || solution === "")
    return

  fetch(`/game/puzzle/${PUZZLE_ID}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      solution
    })
  })
    .then((response) => {
      console.log(response.status)
      if (response.status === 429) {
        // rate limited!
        Swal.fire('Whoa, slow down!', 'You are having a little too much fun! Only 5 attempts per minute per team is allowed.', 'error').then((res) => {
          window.location.reload()
        })
        throw new Error("Too many requests!")
      } else if (response.status === 500) {
        Swal.fire('Server Error!', 'This is most likely our fault, but our server didn\'t respond as expected. Please try again in a little bit.', 'error').then((res) => {
          window.location.reload()
        })
        throw new Error("Server error!")
      } else if (response.status !== 200) {
        Swal.fire('Error!', 'You\'ve triggered Mr. RoboCop, who is here to oversee score operations. Your teammates may be trying to solve at the same time as you! Please try again.', 'error').then((res) => {
          window.location.reload()
        })
        throw new Error("Data racing protection!")
      }
      return response.json()
    })
    .then((res) => {
      if (res.success) {
        Swal.fire('Correct!', res.message, 'success')
        document.getElementById(
          'solve-wrapper'
        ).innerHTML = `<p>${res.message}</p>`
        document.getElementById('solve-article').classList.add('is-success')
      } else {
        Swal.fire('Incorrect!', res.message, 'error')
        solutionBox.value = ''
      }
    })
    .catch((err) => {
      console.log(err)
    })
}

solveBtn.addEventListener('click', solve)
