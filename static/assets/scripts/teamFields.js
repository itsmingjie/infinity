const csrfToken = document.getElementById('csrfToken').value

/* eslint-disable no-undef */
document.querySelectorAll('input.input').forEach((el) => {
  el.addEventListener('blur', function (e) {
    if (!el.dataset.hassave) {
      let wrapper = document.createElement('div')
      wrapper.setAttribute('class', 'control')
      wrapper.setAttribute('id', `save-${el.dataset.prop}`)

      let saveButton = document.createElement('a')
      saveButton.setAttribute('class', 'button noFloat')
      saveButton.setAttribute('id', `button-${el.dataset.prop}`)
      saveButton.innerHTML = '<i class="fas fa-check"></i>'
      saveButton.addEventListener('click', () => {
        console.log(`Set ${el.dataset.prop} to ${el.value}`)
        el.setAttribute('readonly', true)
        saveButton.classList.add('is-loading')

        fetch('/account/update', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            key: el.dataset.prop,
            value: el.value
          })
        }).then((response) => {
            console.log(response)

          const t = document.getElementById(`save-${el.dataset.prop}`)
          saveButton.classList.remove('is-loading')
          t.firstChild.classList.add('is-success')

          setTimeout(() => {
            t.parentNode.removeChild(t)
            el.removeAttribute('readonly')
            el.removeAttribute('data-hassave')
          }, 2000)
        }).catch(err => {
            console.log(err)
        })
      })

      wrapper.appendChild(saveButton)

      el.parentNode.after(wrapper)
      el.setAttribute('data-hassave', true)
    }
  })
})
