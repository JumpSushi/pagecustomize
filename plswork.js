document.addEventListener('DOMContentLoaded', function() {
    const demoContent = document.getElementById('demoContent');
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const textColor = document.getElementById('textColor');
    const textTransform = document.getElementById('textTransform');
    fontFamily.addEventListener('change', function(e) {
        if (e.target.value === "") {
            demoContent.style.fontFamily = "";
        } else{
            demoContent.style.fontFamily = e.target.value;
        }
    });

    fontSize.addEventListener('input', (e) => {
        const size = e.target.value;
        fontSizeValue.textContent = size + 'px';
        demoContent.style.fontSize = size + 'px';
    });

    textColor.addEventListener('input', (e) => {
        demoContent.style.color = e.target.value;
    });
    textTransform.addEventListener('change', (e) => {
        if (e.target.value === "") {
            demoContent.style.textTransform = "";
        } else {
            demoContent.style.textTransform = e.target.value;
        }
    });
});
