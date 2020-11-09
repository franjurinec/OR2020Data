function getFilteredData() {
    console.log('Fetch requested!')
    const fieldElement = document.getElementById('field')
    const queryElement = document.getElementById('query')
    const listElement = document.getElementById('hospital_list')
    listElement.innerHTML = ''

    const queryString = '?' + fieldElement.value + '=' + queryElement.value

    fetch('http://localhost:3000/hospitals' + queryString)
        .then(res => res.json())
        .then(hospitals => {
            console.log(hospitals)
            hospitals.forEach(hospital => {
                const newHospitalElement = document.createElement('div')
                newHospitalElement.classList.add('hospital')
                addElements(newHospitalElement, hospital)
                listElement.appendChild(newHospitalElement)
            })
        })
}

function addElements(element, data) {
    console.log(Object.keys(data))
    Object.keys(data).forEach(key => {
        const attribute = document.createElement("div")
        attribute.classList.add("hospital-attribute")
        if (typeof data[key] === "object") {
            attribute.textContent = "Staff:"
            data[key].forEach(element => {
                const subAttribute = document.createElement("div")
                subAttribute.classList.add("hospital-attribute")
                subAttribute.textContent = "Staff Member:"
                addElements(subAttribute, element)
                attribute.appendChild(subAttribute)
            })
        } else {
            attribute.textContent = (key.charAt(0).toUpperCase() + key.slice(1)).replaceAll('_', ' ') + ': ' + data[key]
        }
        element.appendChild(attribute)
    })
}

(() => {
    console.log('Fetch requested!')
    const listElement = document.getElementById('hospital_list')

    fetch('http://localhost:3000/hospitals')
        .then(res => res.json())
        .then(hospitals => {
            console.log(hospitals)
            hospitals.forEach(hospital => {
                const newHospitalElement = document.createElement('div')
                newHospitalElement.classList.add('hospital')
                addElements(newHospitalElement, hospital)
                listElement.appendChild(newHospitalElement)
            })
        })}
)()