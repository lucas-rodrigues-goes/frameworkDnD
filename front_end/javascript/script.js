`[r:'`

//=====================================================================================================
// Helper functions
//=====================================================================================================

function hash(string) {
    
    let hash = 0;

    if (string.length == 0) return hash;

    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return hash;
}

function getId(id) {return document.getElementById(id)}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function timeUnit(time) {
    const units = [
        { threshold: 14400, unit: "Day" },
        { threshold: 600, unit: "Hour" },
        { threshold: 10, unit: "Minute" },
        { threshold: 1, unit: "Round" }
    ];

    for (const { threshold, unit } of units) {
        if (time >= threshold) {
            const value = Math.round(time / threshold);
            return value + " " + unit + (value > 1 ? "s" : "");
        }
    }

    return "1 Round"; // Default case if time is <= 1
}



//=====================================================================================================
// Style functions
//=====================================================================================================

function animateAccordion() {
    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
        } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        } 
    });
    }
}



//=====================================================================================================
// External functions
//=====================================================================================================

function toBackend(arguments, valueCallback) {
    let request = new XMLHttpRequest();
    request.open("POST", "macro:console@lib:back", true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            valueCallback(request.response);
        }
    };
    request.send(arguments);
}

function closePage(page_name) {
    let request = new XMLHttpRequest();
    request.open("POST", "macro:closePage@lib:front", true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            valueCallback(request.response);
        }
    };
    request.send(page_name);
}

function openPage(page_link, arguments = getId("id").value) {
    let request = new XMLHttpRequest();
    request.open("POST", "macro:openPage@lib:front", true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            valueCallback(request.response);
        }
    };
    request.send(arguments + ";" + page_link);
}

function openClosePage(arguments, page_name, page_link) {
    let request = new XMLHttpRequest();
    request.open("POST", "macro:openClosePage@lib:front", true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            valueCallback(request.response);
        }
    };
    request.send(arguments + ";" + page_name + ";" + page_link);
}

function teleport(arguments) {
    let request = new XMLHttpRequest();
    request.open("POST", "macro:teleport@lib:back", true);

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            valueCallback(request.response);
        }
    };
    request.send(arguments);
}



//=====================================================================================================

`']`