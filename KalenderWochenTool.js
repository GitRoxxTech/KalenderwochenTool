function weekNumber(date = new Date()) {
    var firstJanuary = new Date(date.getFullYear(), 0, 1);
    var dayNr = Math.ceil((date - firstJanuary) / (24 * 60 * 60 * 1000));
    var weekNr = Math.ceil((dayNr + firstJanuary.getDay()) / 7)-1;
    return weekNr;
}

async function isHoliday(date = new Date()) {
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let newDate = (day) + "." + (month) + "." + date.getFullYear();
    var isHoliday = $.get("https://ipty.de/feiertag/api.php", {
        'do': "isFeiertag",
        'datum': newDate,
        'loc': "BW"
    })
    return isHoliday;
}

async function getWorkDays(startDate = $('#startDate').val(), endDate = $('#endDate').val()) {
    if(startDate === '') return;
    if(endDate === '') return;

    var days = [];
    for(var date = new Date(startDate); date <= new Date(endDate); date.setDate(date.getDate()+1)) {
        // console.log(date);
        if(date.getDay() === 0) continue;
        days.push(isHoliday(date));
    }
    days = await Promise.all(days);
    var workDays = days.reduce((workDays, isHoliday) => workDays+=isHoliday==="0", 0);
    // console.log(workDays);
    $('#workDays').html(workDays);
}

$(function() {
    $('#currentWeek').html(weekNumber());

    getWorkDays();
    $('#startDate, #endDate').change(() => getWorkDays());
})