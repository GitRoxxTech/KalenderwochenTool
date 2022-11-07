function onClickOutside(selector, func) {
    const outsideClickListener = (event) => {
      const $target = $(event.target);
      if (!$target.closest(selector).length && $(selector).is(':visible')) {
          func();
        //   removeClickListener();
      }
    }
  
    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener);
    }
    
    document.addEventListener('click', outsideClickListener);
}

const holidayData = new Map();
const holidayData2 = new Map();
const countiesData = new Map();

async function getCountries() {
    let countries = await $.get("https://date.nager.at/api/v3/AvailableCountries", {
    });
    for(const {countryCode, name} of countries) {
        addCountry(countryCode, name);
        var request = getDataSpectrum(-1, 1, countryCode);
        // if(countryCode == getSelectedCountry()) await request;
    }
}

async function getDataSpectrum(before, after, countryCode = getSelectedCountry(), startYear = getSelectedYear()) {
     // get all holidays for a span of years
    let requests = [];
    for(var year = startYear+before; year <= startYear+after; year++)
        requests.push(getHolidayData(year, countryCode));
    // wait for all requests to be received
    return Promise.all(requests);
}

function addCountry(code, name) {
    countiesData.set(code, new Array());
        var option = $('<a></a>', {
            class: 'list-group-item list-group-item-action',
            href: '#'+code,
           
            text: name,
        });
      
        var countyoptions = $('<div></div>', {
            id: code,
        }).append($('<a></a>', {
            class: 'list-group-item list-group-item-action',
            href: '#'+code,
            html: $('<h4></h4>', {
                text: name,
            })
        }));
        $("#countryOption").append(option);
        $("#countiesOption").append(countyoptions);
        $("#countryDropdown").append(option);
} 

async function getHolidayData(year, country = getSelectedCountry()) {
    if(isNaN(year)) return;
    if(holidayData2.has(country) && holidayData2.get(country).has(year)) return;

    // get raw data
    let rawData = await $.get("https://feiertage-api.de/api/", {
        'jahr': year,
    })

    let testData = await $.get("https://date.nager.at/api/v3/publicholidays/"+year+"/"+country, {
    })

    // transform data format
    let data = new Map()
    Object.entries(rawData).forEach(([bundesLand, holidays]) => {data.set(bundesLand, Object.values(holidays).map(holiday => new Date(holiday.datum)));});
    
    if(!holidayData2.has(country)) holidayData2.set(country, new Map());
    holidayData2.get(country).set(year, testData);

    // check new counties
    if(!countiesData.has(country)) addCountry(country, country);

    for(const {counties} of testData) {
        if(counties == null) continue;

        for(const county of counties) {
            // add county to list if not yet existing
            if(countiesData.get(country).includes(county)) continue;
            countiesData.get(country).push(county);

            var countyOption = $('<a></a>', {
                class: 'nav-link ms-3 my-1',
                href: '#'+county,
                text: county,
            })
           
            $('[id="'+country+'"]:last').append(countyOption);
            // await updateCountrySelection(country);

            if(country == getSelectedCountry()) updateCountiesOptions();
        }
    }

    // TODO update display

    // for(const county of countiesData.get(country))
        // console.log(county);

    // console.log(holidayData);
    // console.log(holidayData2);
    
    // store data
    holidayData.set(year, data);
}

function hasHolidayData(year) {
    var county = location.hash.slice(1);
    var country = county.slice(0, 2);
    if(!holidayData2.has(country)) return false;
    if(!holidayData2.get(country).has(year)) return false;
    if(!countiesData.has(country)) return false;
    return true;
}

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

function getSelectedCountry() {
    return location.hash.slice(1, 3);
}

function getSelectedCounty() {
    return location.hash.slice(1);
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

async function isHoliday(dates = new Date()) {
    dates.setHours(0,0,0,0); // match time format

    // check if year data exists
    const year = dates.getFullYear();
    if(!holidayData.has(year)) await getHolidayData(year);

    // check if county exists
    // var county = $('#countrySelection').val();
    var county = location.hash.slice(1);
    var country = county.slice(0, 2);
    if(!holidayData2.has(country)) await getHolidayData(year);
    if(!holidayData2.get(country).has(year)) await getHolidayData(year);
    if(!countiesData.has(country)) await getHolidayData(year);
    if(!countiesData.get(country).includes(county)) county = country+'-NATIONAL';

    // console.log(county);
    // var result = holidayData.get(year).get(county.slice(3)).some(holiday => +holiday.setHours(0) === +dates);
    var result2 = holidayData2.get(country).get(year).some(({date, global, counties}) => (global===true || counties.some(_county => _county === county))  &&+new Date(date).setHours(0) === +dates);
// if(result != result2) console.log(dates);
    // check if date is holiday
    return result2;
}

async function updateCalendarWeeksTable(year = getSelectedYear()) {
	year = getValidYear(year); 

    $('#calendarWeeksYear').html(year);
    var table = document.getElementById("calendarWeeksTableBody");

    // remove old values
    // Array.from(table.rows).forEach((row, index) => index > 1 && row.remove());
    table.innerHTML = "";
    console.log(!hasHolidayData(year-1) || !hasHolidayData(year) || !hasHolidayData(year+1));
    if(!hasHolidayData(year-1) || !hasHolidayData(year) || !hasHolidayData(year+1)) {
        $("#calendarLable").css("display", "none");
        await getDataSpectrum(-1, 1);
        $("#loadingSpinner").css("display","none");
        $("#calendarLable").css("display", "");
    }
    
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
        if(date.getFullYear() != year) {cell.classList.add("bg-lightgray"); }
        else if(date.getDay() === 0 ) {cell.classList.add("style-accent-bg"); cell.classList.add("border"); cell.classList.add("text-white");}
        else if(date.getDay() === 6) {cell.classList.add("style-light-accent-bg"); cell.classList.add("border"); cell.classList.add("text-white");}
        if(await isHoliday(date)) {cell.classList.remove("text-white"); cell.classList.add("text-danger"); cell.classList.add("border"); cell.classList.add("border-danger");}
    }
}

async function updateCountrySelection(country) {
    // var country = $('#countrySelection').val().slice(0, 2);
    if(!countiesData.has(country)) await getHolidayData(year);

    // let optgroup = $('#OPTION-'+country);
    // optgroup.label("country")
    // for(const county of countiesData.get(country)) {
    //     var opt = document.createElement('option');
    //     opt.value = county;
    //     opt.innerHTML = county;
    //     optgroup.append(opt);
    //     // opt.appendTo('#countrySelection');
    // }
}

function showDropdown(id) {
    document.getElementById(id).classList.toggle("show");
}
  
function filterFunction(divId, searchId) {
    var input, filter, ul, li, a, i;
    input = document.getElementById(searchId);
    filter = input.value.toUpperCase();
    div = document.getElementById(divId);
    a = div.getElementsByTagName("a");
    for (i = 0; i < a.length; i++) {
        txtValue = a[i].textContent || a[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
        } else {
            a[i].style.display = "none";
        }
    }
}

function updateCountiesOptions() {
    var country = getSelectedCountry();
    if(!countiesData.get(country)) return;
    var counties = countiesData.get(country);
    console.log(getSelectedCounty());
    $("#countiesOptions").html("");
    $("#countiesOptions").append($('<a></a>', {
        class: 'list-group-item list-group-item-action '+(getSelectedCounty()===country?"style-accent-bg":''),
        href: '#'+country,
        text: "National",
    }));

    counties.forEach((county) => {
        var option = $('<a></a>', {
            class: 'list-group-item list-group-item-action '+(getSelectedCounty()===county?"style-accent-bg":''),
            href: '#'+county,
            text: county,
        });
        $("#countiesOptions").append(option);
    });
}

function getWorkDaysBrutto(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val())) {
    if(isNaN(startDate)) return;
    if(isNaN(endDate)) return;
    startDate.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0);

    var days = [];
    var saturdays = [];
    var sundays = [];
    for(var date = new Date(startDate); date <= endDate; date.setDate(date.getDate()+1)) {
        // check if sunday
        if(date.getDay() === 0) { sundays.push(new Date(date)); continue; }
        // check if saturday
        if(date.getDay() === 6) { saturdays.push(new Date(date)); if(!$("#saturdaySwitch").is(":checked")) continue; }
        
        days.push(new Date(date));
    }

    return [days, saturdays, sundays];
}

function setWeekInfos(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val())) {
    if(isNaN(startDate)) return;
    if(isNaN(endDate)) return;

    $('#startDay').html(toDayString(startDate.getDay()));
    $('#endDay').html(toDayString(endDate.getDay()));
    $('#startWeek').html('KW'+getWeekNumber(startDate)+' '+startDate.getFullYear());
    $('#endWeek').html('KW'+getWeekNumber(endDate)  +' '+endDate.getFullYear());
}

function setResultInfos(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val())) {
    if(isNaN(startDate)) return;
    if(isNaN(endDate)) return;

    var differenceDays = Math.ceil((endDate - startDate) / (24*60*60*1000))+1;
    $('#calendarDays').val(differenceDays);
    [days, saturdays, sundays] = getWorkDaysBrutto();
    $('#workDaysBrutto').val(days.length);
    $('#saturdays').html(saturdays.length);
    $('#sundays').html(sundays.length);
    $('#weekends').html(Math.max(saturdays.length, sundays.length)+(sundays[0].getDate()<saturdays[0].getDate()?1:0));
    // $('#holidays').html(days.length-$('#workDaysNetto').val());
    $('#calendarWeeks').html((Math.round(differenceDays/7*1000)/1000).toString().replace('.', ','));

    $("#workDaysSpinner").css("display", "none");
    $("#workDaysResult").css("display", "");    
}

function clearResultInfos(clearStart = false, clearEnd = false) {
    $("#workDaysSpinner").css("display", "");
    $("#workDaysResult").css("display", "none");

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

    $('#calendarDays').val(null);
    $('#workDaysBrutto').val(null);
    $('#saturdays').html(null);
    $('#sundays').html(null);
    $('#weekends').html(null);
    $('#holidays').html(null);
    $('#calendarWeeks').html(null);
}

function getDateFromKalanderDays(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val()), days = parseInt($('#calendarDays').val())) {
    if(isNaN(days)) return;
    if(days < 1) {
        days = 1;
        $('#calendarDays').val(1);
    }
    var isStart = isNaN(startDate);
    days--; // to include startDate as work date
    var newDate = new Date((isStart ? endDate.setDate(endDate.getDate()-days) : startDate.setDate(startDate.getDate()+days)));
    var month = ('0'+(newDate.getMonth()+1)).slice(-2);
    var day = ('0'+newDate.getDate()).slice(-2);
    var dateString = newDate.getFullYear()+'-'+month+'-'+day;

    $(isStart?'#startDate':'#endDate').val(dateString);

    getWorkDays();
}

async function getDate(isNetto=true, startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val()), workDays = parseInt($('#workDaysNetto').val())) {
    if(!isNetto) workDays = parseInt($('#workDaysBrutto').val());
    if(isNaN(workDays)) return;
    if(workDays < 1) {
        workDays = 1;
        $(isNetto?'#workDaysNetto':'#workDaysBrutto').val(1);
    }
    var isStart = isNaN(startDate);

    clearResultInfos(isStart, !isStart);

    for(var date = new Date(isStart?endDate:startDate), currentWorkDays = 0; currentWorkDays < workDays; date.setDate(date.getDate()+(isStart?-1:1))) {
        // check if sunday
        if(date.getDay() === 0) continue;
        if(date.getDay() === 1 && !$("#saturdaySwitch").is(":checked")) continue;
        if(isNetto && await isHoliday(date)) continue;
        currentWorkDays++;
    }
    date.setDate(date.getDate()-(isStart?-1:1));

    var month = ('0'+(date.getMonth()+1)).slice(-2);
    var day = ('0'+date.getDate()).slice(-2);
    var dateString = date.getFullYear()+'-'+month+'-'+day;

    $(isStart?'#startDate':'#endDate').val(dateString);
    if(!isNetto) return getWorkDays();
    setWeekInfos();
    setResultInfos();
}

async function getWorkDays(startDate = new Date($('#startDate').val()), endDate = new Date($('#endDate').val())) {
    if(isNaN(startDate)) return;
    if(isNaN(endDate)) return;

    clearResultInfos();
    setWeekInfos();

    var workDays = 0;
    var holidays = [];

    // check all days in between
    for(var date = new Date(startDate); date <= endDate; date.setDate(date.getDate()+1)) {
        // console.log(date);

        // check if holiday
        if(await isHoliday(date)) { holidays.push(date); continue; }

        // check if sunday
        if(date.getDay() === 0) continue;

        // check if saturday
        if(date.getDay() === 6 && !$("#saturdaySwitch").is(":checked")) continue;

        // else is workday
        workDays++;
    }

    $('#holidayList').html("");

    for(holiday of holidays) {
        var entry = $('<tr></tr>', {
            
        })
        entry.append($('<th></th>', {text: holiday.toLocaleDateString()}));
        entry.append($('<td></td>', {text: "Feiertag xy"}));
        $('#holidayList').append(entry);
    }

    $('#workDaysNetto').val(workDays);
    $('#holidays').html(holidays.length);
    setResultInfos();
}

// init
$(async function() {
    // get countries
    var startTime = new Date();
    // getDataSpectrum(-2, 5);
    var endTime = new Date();
    console.log(new Date(endTime-startTime).getTime());
    startTime = new Date();
    getCountries();
    var endTime = new Date();
    console.log(new Date(endTime-startTime).getTime());
    startTime = new Date();

    const scrollSpy = new bootstrap.ScrollSpy($("#countiesOption"), {
        target: '#countryOption'
      })
    location.hash = 'DE-BW';
    console.log("countries received");

    // get calendar week
    const currentYear = new Date().getFullYear();
    $('#currentWeek').html(getWeekNumber());
    updateCalendarWeeksTable(currentYear);

    $('#yearInput').val(currentYear);
    // set calendar year listener
    $('#lastYearButton').click(() => { $('#yearInput').val(getSelectedYear()-1); updateCalendarWeeksTable(); getDataSpectrum(-2, 5); });
    $('#nextYearButton').click(() => { $('#yearInput').val(getSelectedYear()+1); updateCalendarWeeksTable(); getDataSpectrum(-2, 5); });
    $('#yearInput').change(() =>     { $('#yearInput').val(getSelectedYear());   updateCalendarWeeksTable(); getDataSpectrum(-2, 5); });
    endTime = new Date();
    console.log(new Date(endTime-startTime).getTime());
    startTime = new Date();

    // get work days
    getWorkDays();
    endTime = new Date();
    console.log(new Date(endTime-startTime).getTime());
    startTime = new Date();

    // set work day listener
    $('#startDate, #endDate').change(() => getWorkDays());
    $('#calendarDays').change(() => {getDateFromKalanderDays()});
    $('#workDaysNetto').change(() => {getDate()});
    $('#workDaysBrutto').change(() => {getDate(false)});
    $('#saturdaySwitch').change(() => {getWorkDays()});

    $('#countrySelection').change(() => {getWorkDays(); updateCalendarWeeksTable()});
    $( window ).on( 'hashchange', () => {getWorkDays(); updateCalendarWeeksTable(); $('#countrySelectionButton').html(location.hash.slice(1)); updateCountiesOptions(); getDataSpectrum(-2, 5);});

    onClickOutside($("#countryDropdownButton"), function() { if($("#countryDropdown").is(':visible') &&  !document.activeElement.classList.contains("search")) $("#countryDropdown").toggleClass("show"); });
    onClickOutside($("#countyDropdownButton"), function() { if($("#countyDropdown").is(':visible') && !document.activeElement.classList.contains("search")) $("#countyDropdown").toggleClass("show"); });

    $('#holidayLable').click(function() {console.log("test"); $("#holidayListToggle").toggleClass("hide");});
    endTime = new Date();
    console.log(new Date(endTime-startTime).getTime());
})