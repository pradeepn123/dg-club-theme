function openTabContent(){
    console.log('clikced.....')
    var tablinks = document.querySelectorAll('.register')
    tablinks.forEach(tab => {
        tab.addEventListener('click', () => {
            tablinks.forEach(activeTabs => activeTabs.classList.remove('active'));
            tab.classList.add('active')
        })
    })
}