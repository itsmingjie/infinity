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

        fetch('/admin/update', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prop: el.dataset.prop,
            value: el.value
          })
        }).then((response) => {
          const t = document.getElementById(`save-${el.dataset.prop}`)
          saveButton.classList.remove('is-loading')
          t.firstChild.classList.add('is-success')

          setTimeout(() => {
            t.parentNode.removeChild(t)
            el.removeAttribute('readonly')
            el.removeAttribute('data-hassave')
          }, 2000)
        })
      })

      wrapper.appendChild(saveButton)

      el.parentNode.after(wrapper)
      el.setAttribute('data-hassave', true)
    }
  })
})

document.querySelectorAll('.button.endpoint').forEach((el) => {
  const og = el.textContent
  el.addEventListener('click', function () {
    el.classList.add('is-loading')
    fetch(el.dataset.target, {
      method: el.dataset.method || 'GET'
    })
      .then((response) => {
        if (response.status === 200) {
          el.classList.remove('is-loading')
          el.classList.add('is-success')
          el.textContent = 'SUCCESS!'
          setTimeout(() => {
            el.classList.remove('is-success')
            el.textContent = og
          }, 2000)
        } else {
          console.log('test')
          el.classList.remove('is-loading')
          el.classList.add('is-danger')
          el.textContent = 'ERROR: ENDPOINT UNREACHABLE'
          setTimeout(() => {
            el.classList.remove('is-danger')
            el.textContent = og
          }, 2000)
        }
      })
      .catch((e) => {
        el.classList.remove('is-loading')
        el.classList.add('is-danger')
        el.textContent = 'ERROR: ENDPOINT UNREACHABLE'
        setTimeout(() => {
          el.classList.remove('is-danger')
          el.textContent = og
        }, 2000)
      })
  })
})

document.querySelectorAll("input[type='checkbox']").forEach((el) => {
  el.addEventListener('change', function (e) {
    fetch('/admin/update', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prop: el.dataset.prop,
        value: e.target.checked
      })
    }).then((response) => {
      el.parentNode.classList.add('is-success')

      setTimeout(() => {
        el.parentNode.classList.remove('is-success')
      }, 2000)
    })
  })
})
