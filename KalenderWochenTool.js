function weekNumber(date = new Date()) {
    // calculate week number
    var firstJanuary = new Date(date.getFullYear(), 0, 1);
    var dayNr = Math.ceil((date - firstJanuary) / (24 * 60 * 60 * 1000));
    var weekNr = Math.ceil((dayNr + firstJanuary.getDay()) / 7)-1;
    return weekNr;
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

async function getWorkDays(startDate = $('#startDate').val(), endDate = $('#endDate').val()) {
    if(startDate === '') return;
    if(endDate === '') return;

    // get all days in between
    var days = [];
    for(var date = new Date(startDate); date <= new Date(endDate); date.setDate(date.getDate()+1)) {
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
    $('#workDays').html(workDays);
}

$(function() {
    // get calendar week
    $('#currentWeek').html(weekNumber());

    // get work days
    getWorkDays();

    // set work day listener
    $('#startDate, #endDate').change(() => getWorkDays());
})