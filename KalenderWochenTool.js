// helper functions
function onlyNumberKey(event) {
    if(!/[0-9]/.test(event.key)) event.preventDefault();
}

function toDayString(day) {
    if(isNaN(day)) return NaN;
    switch(day) {
        case 0: return 'Sonntag';
        case 1: return 'Montag';
        case 2: return 'Dienstag';
        case 3: return 'Mittwoch';
        case 4: return 'Donnerstag';
        case 5: return 'Freitag';
        case 6: return 'Samstag';
        default: return NaN;
    }
}

function getWeekNumber(d = new Date()) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return week number
    return weekNo;
}

function getSelectedYear() {
    var year = parseInt($('#yearInput').val());
    return getValidYear(year);
}

function getValidYear(year) {
    const currentYear = new Date().getFullYear();
    if(year == null) return currentYear;
    if(year == undefined) return currentYear;
    if(isNaN(year)) return currentYear;

    // if(year < 101) year = 101;
    // if(year > 100000) year = 100000;
    if(year < 1900) year = 1900;
    if(year > 2099) year = 2099;
    return year;
}

async function isHoliday(date = new Date()) {
    // transform date format
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let newDate = (day) + "." + (month) + "." + date.getFullYear();

    // get whether day is a holiday
    return $.get("https://ipty.de/feiertag/api.php", {
        'do': "isFeiertag",
        'datum': newDate,
        'loc': "BW"
    })
}

function updateCalendarWeeksTable(year = getSelectedYear()) {
	year = getValidYear(year); 

    $('#calendarWeeksYear').html(year);
    var table = document.getElementById("calendarWeeksTable");

    // remove old values
    Array.from(table.rows).forEach((row, index) => index > 1 && row.remove());
    
    var firstJanuary = new Date(year, 0, 1);
    var lastMonday = 31-(firstJanuary.getDay()||7)+2;
    
    for(var date = new Date(year-1, 11, lastMonday); date <= new Date(year, 11, 31) || date.getDay() != 1; date.setDate(date.getDate()+1)) {
        if(date.getDay() == 1) {
            row = table.insertRow();
            var cell = row.insertCell();
            cell.innerHTML = ('0'+getWeekNumber(date)).slice(-2);
            cell.classList.add("calendarTableWeekCell");
        }
        var day = ('0'+date.getDate()).slice(-2);
        var month = ('0'+(date.getMonth()+1)).slice(-2);
        var dateString = day + '.' + month + '.'
        var cell = row.insertCell();
        cell.innerHTML = dateString;
        cell.classList.add("calendarTableCell");
        if(date.getFullYear() != year) cell.classList.add("bg-lightgray");
    }
}

function getWorkDaysBrutto(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val())) {
    if(isNaN(startDate)) return;
    if(isNaN(endDate)) return;

    var days = [];
    for(var date = new Date(startDate); date <= endDate; date.setDate(date.getDate()+1)) {
        // check if sunday
        if(date.getDay() === 0) continue;
        
        days.push(date);
    }

    return days;
}

function setResultInfos(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val())) {
    if(isNaN(startDate)) return;
    if(isNaN(endDate)) return;

    $('#startDay').html(toDayString(startDate.getDay()));
    $('#endDay').html(toDayString(endDate.getDay()));
    $('#startWeek').html('KW'+getWeekNumber(startDate)+' '+startDate.getFullYear());
    $('#endWeek')  .html('KW'+getWeekNumber(endDate)  +' '+endDate.getFullYear());

    var differenceDays = Math.ceil((endDate - startDate) / (24*60*60*1000))+1;
    $('#calendarDays').html(differenceDays);
    $('#workDaysBrutto').html(getWorkDaysBrutto().length);
    $('#calendarWeeks').html((Math.round(differenceDays/7*1000)/1000).toString().replace('.', ','));
}

function clearResultInfos(clearStart = false, clearEnd = false) {
    if(clearStart === true) {
        $('#startDate').val(null);
    } else if(clearEnd === true) {
        $('#endDate').val(null);
        
    } else {
        $('#workDaysNetto').val(null);
    }

    $('#startDay').html(null);
    $('#startWeek').html(null);
    $('#endDay').html(null);
    $('#endWeek').html(null);

    $('#calendarDays').html(null);
    $('#workDaysBrutto').html(null);
    $('#calendarWeeks').html(null);
}

async function getDate(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val()), workDays = parseInt($('#workDaysNetto').val())) {
    if(isNaN(workDays)) return;
    if(workDays < 1) {
        workDays = 1;
        $('#workDaysNetto').val(1);
    }
    var isStart = isNaN(startDate);

    clearResultInfos(isStart, !isStart);

    for(var date = new Date(isStart?endDate:startDate), currentWorkDays = 0; currentWorkDays < workDays; date.setDate(date.getDate()+(isStart?-1:1))) {
        // check if sunday
        if(date.getDay() === 0) continue;
        if(await isHoliday(date) === '1') continue;
        currentWorkDays++;
    }
    date.setDate(date.getDate()-(isStart?-1:1));

    var month = ('0'+(date.getMonth()+1)).slice(-2);
    var day = ('0'+date.getDate()).slice(-2);
    var dateString = date.getFullYear()+'-'+month+'-'+day;

    $(isStart?'#startDate':'#endDate').val(dateString);
    setResultInfos();
}

async function getWorkDays(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val())) {
    if(isNaN(startDate)) return;
    if(isNaN(endDate)) return;

    clearResultInfos();

    // get all days in between
    var days = [];
    for(var date = new Date(startDate); date <= endDate; date.setDate(date.getDate()+1)) {
        // console.log(date);

        // check if sunday
        if(date.getDay() === 0) continue;

        // check if holiday
        days.push(isHoliday(date));
    }

    // wait for all requests to be received
    days = await Promise.all(days);

    // count workdays
    var workDays = days.reduce((workDays, isHoliday) => workDays+=isHoliday==="0", 0);

    // console.log(workDays);
    $('#workDaysNetto').val(workDays);
    setResultInfos();
}

// init
$(function() {
    // get calendar week
    $('#currentWeek').html(getWeekNumber());
    updateCalendarWeeksTable(new Date().getFullYear());
    $('#yearInput').val(new Date().getFullYear())
    // set calendar year listener
    $('#lastYearButton').click(() => { $('#yearInput').val(getSelectedYear()-1); updateCalendarWeeksTable(); });
    $('#nextYearButton').click(() => { $('#yearInput').val(getSelectedYear()+1); updateCalendarWeeksTable(); });
    $('#yearInput').change(() =>     { $('#yearInput').val(getSelectedYear());   updateCalendarWeeksTable(); });

    // get work days
    getWorkDays();

    // set work day listener
    $('#startDate, #endDate').change(() => getWorkDays());
    $('#workDaysNetto').change(() => {getDate()});
})