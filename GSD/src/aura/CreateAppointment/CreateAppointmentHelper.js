({    
    fetchData: function(component, event, helper){        
        var action = component.get("c.getData");
        action.setParams({leadId : component.get("v.leadId")});
        
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS"){                
                component.set("v.lead", response.getReturnValue().lead);
                component.set("v.owner", response.getReturnValue().owner);               
                component.set("v.events", this.transformToFullCalendarFormat(component, response.getReturnValue().events));                
                this.loadCalendar(component, event, helper);
                
                console.log("LeadId " + component.get("v.lead.Id"));
                console.log("OwnerId " + component.get("v.lead.Owner.Id"));
                console.log("Events length: " + component.get("v.events").length);
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                }else{
                    console.log("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);        
    },    
	transformToFullCalendarFormat: function(component, events) {
        var eventArr = [];
        for(var i = 0;i < events.length;i++){
            eventArr.push({
                'id':events[i].Id,
                'start':events[i].StartDateTime,
                'end':events[i].EndDateTime,
                'title':events[i].Subject,
                'location': events[i].Location,
            });
        }
        return eventArr;
    },
    popTimePicklists: function(component, event, helper){
        var hours = new Array();
        for (var i = 1; i < 13; i++){            
            hours.push(i.toString().padStart(2, "0"));
        }                
        component.set("v.hours", hours);
        var minutes = ["00", "15", "30", "45"];
        component.set("v.minutes", minutes);
        var ampm = ["am", "pm"];
        component.set("v.ampm", ampm);
    },
    isAmPm: function(hour){
        if (hour < 12){
            return "am";
        }else{
            return "pm";
        }
        //return 'am';
    },
    popShowAsPicklist: function(component, event, helper){
    	var action = component.get("c.getShowAsPicklist");
		action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS"){                                
                component.set("v.evShowAs", response.getReturnValue());                
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                }else{
                    console.log("Error getting the Event Show As picklist values");
                }
            }
        });
        $A.enqueueAction(action);          
    },
    popSubjectPicklist: function(component, event, helper){
        var action = component.get("c.getSubjectPicklist");
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS"){                                                
                component.set("v.evSubject", response.getReturnValue());                
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                }else{
                    console.log("Error getting the Event Show As picklist values");
                }
            }
        });
        $A.enqueueAction(action);  
    },
    updateSFEvent: function(component, event){                
        
        var returnDate = new Object({
            id: 'NewEvent',
            start: event.start,
            startDate: event.start.format('MM/DD/YYYY'),
            startTimes: {
                hour: event.start.format('hh'),
                minute: event.start.format('mm'),
                ampm: this.isAmPm(event.start.utc().local().hour()),
            },                    
            end: event.end,
            endDate: event.end.format('MM/DD/YYYY'),
            endTimes: { 
                hour: event.end.format('hh'),
                minute: event.end.format('mm'),
                ampm: this.isAmPm(event.end.utc().local().hour()),
            },
            title: component.get("v.newJSEvent").title,
            showAs: component.get("v.newJSEvent").showAs,
            editable: true,
        })        
        return returnDate;                
    },
    updateJSEvent: function(jsEvent, sfEvent){
        
        var upStMonth = parseInt(sfEvent.start.month()) + 1;
        var upEnMonth = parseInt(sfEvent.end.month()) + 1;
                                 
        var startStr = sfEvent.start.year() + '-' + upStMonth + '-' + sfEvent.start.date() +
            ' ' + sfEvent.startTimes.hour + ':' + sfEvent.startTimes.minute + ' ' + sfEvent.startTimes.ampm;
        var newStart = moment(startStr, "YYYY-MM-DD h:mm a");        
        
        var endStr = sfEvent.end.year() + '-' + upEnMonth + '-' + sfEvent.end.date() + 
            ' ' + sfEvent.endTimes.hour + ':' + sfEvent.endTimes.minute + ' ' + sfEvent.endTimes.ampm;
        var newEnd = moment(endStr, "YYYY-MM-DD h:mm a");
                
        jsEvent.start = newStart;        
        jsEvent.end = newEnd;        
        
        jsEvent.editable = true;
        return jsEvent;
    },
    isBusinessHours: function(newEvent){ 
        console.log('Checking is business hours');
        if(newEvent.start.utc().local().hour() < 6 || 
           newEvent.start.utc().local().hour() >= 20 ||
           newEvent.end.utc().local().hour() < 6 || 
           newEvent.end.utc().local().hour() > 20 ||
           newEvent.start.utc().local().day() == 0 ||
           newEvent.start.utc().local().day() == 6 || 
           newEvent.end.utc().local().day() == 0 || 
           newEvent.end.utc().local().day() == 6
          ){
            console.log('Business hours is false');
            return false;
        }else{
            console.log('Business hours is true');
            return true;
        }            
    },
    isDoubleBooked: function(newEvent, events){
        console.log('Checking is double booked');
        var isDoubleBooked = false;
        var newEvSt = newEvent.start.unix();
        var newEvEn = newEvent.end.unix();
        console.log('New Ev St: ' + newEvSt);
        console.log('New Ev En: ' + newEvEn);
        for (var i = 0; i < events.length; i++){
            var iEventSt = moment(events[i].start, "YYYY-MM-DD HH:mm ZZ");
            var iEventEn = moment(events[i].end, "YYYY-MM-DD HH:mm ZZ");
            
            var evSt = iEventSt.unix();
            var evEn = iEventEn.unix();
                        
            if(newEvSt >= evSt && newEvSt < evEn ||
               newEvEn > evSt && newEvEn <= evEn){                
                isDoubleBooked = true;
            }
        }
        console.log('Double booked is : ' + isDoubleBooked);
        return isDoubleBooked;
    },
    convertLead: function(component, event, helper){
        var action = component.get("c.getConvertLead");
        
        action.setParams({leadRecord: component.get("v.lead")});
        action.setCallback(this, function(response){            
            var state = response.getState();
            if (state === "SUCCESS"){
                console.log('Lead converted, opptId: ' + response.getReturnValue().ConvertedOpportunityId);
                component.set("v.lead", response.getReturnValue());
				this.insertEvent(component,event,helper);                
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                }else{
                    console.log("Unknown error");
                }
            }
        });
		$A.enqueueAction(action);
                
    },
    insertEvent: function(component, event, helper){
		
        var action = component.get("c.getInsertEvent");
        var urlEvent = $A.get("e.force:navigateToURL");
        action.setParams({
            unixStart: component.get("v.newJSEvent").start.format('x'),
            unixEnd: component.get("v.newJSEvent").end.format('x'),
            showAs: component.get("v.newJSEvent").showAs,
            subject: component.get("v.newJSEvent").title,
            contactId: component.get("v.lead").ConvertedContactId,
            opptId: component.get("v.lead").ConvertedOpportunityId,
        });
        action.setCallback(this, function(response){
            var state = response.getState();
            
            if (state === "SUCCESS"){                                
                console.log('Inserted Event: ' + response.getReturnValue().Id);
                component.set("v.newEvent", response.getReturnValue());                                
                urlEvent.setParams({
                    "url": "/" + component.get("v.lead").ConvertedOpportunityId,
                })
                urlEvent.fire();
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                }else{
                    console.log("Error inserting event");
                }
            }
        });
        $A.enqueueAction(action);  
    },
    loadCalendar: function(component, event, helper){
        var data = component.get("v.events");
		$('#calendar').fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'agendaWeek,agendaDay'
      		},
            timezone: 'local',
            selectable: true,
            defaultView: 'agendaWeek',
            defaultDate: moment().format('YYYY-MM-DD'),// '2018-03-12',
      		navLinks: true, 
      		editable: false,	        
            events: data,
            weekends: false,
            slotDuration: '00:30:00',            
            minTime: "06:00:00",
            maxTime: "18:00:00",            
            contentHeight: "auto",
            allDaySlot: false,            
            dayClick: function(date, jsEvent, view) {
                if(component.get("v.eventSaved") == false){                    
                	var newJSEvent = new Object({
                        id: 'NewEvent',
                        start: date,
                        startDate: date.format('MM/DD/YYYY'),
                        startTimes: {
                            hour: date.format('hh'),
                            minute: date.format('mm'),
                            ampm: helper.isAmPm(date.hour()),
                        },                    
                        end: moment(date).add(1,'hours'),
                        endDate: moment(date).format('MM/DD/YYYY'),
                        endTimes: { 
                            hour: moment(date).add(1,'hours').format('hh'),
                            minute: date.format('mm'),
                            ampm: helper.isAmPm(moment(date).add(1,'hours').hour()),
                            },
                        title: '',
                        showAs: '',
                        editable: true,
                	});                    
                    component.set("v.newJSEvent", newJSEvent);                    
                    component.set("v.isNewEvent", true);
                }
            },            
            eventDrop: function(event, delta, revertFunc, jsEvent, ui, view){                
                var newEvent = helper.updateSFEvent(component, event);
                component.set("v.newJSEvent", newEvent);                                                    
            },
            eventClick: function(event){  
                if (event.editable == true){
                	component.set("v.calEvent", event);
                	component.set("v.isNewEvent", true);    
                }
                
            },
            eventResize: function( event, delta, revertFunc, jsEvent, ui, view ) { 
            	var newEvent = helper.updateSFEvent(component, event);
                component.set("v.newJSEvent", newEvent);   
            },
    	});
    }
    
})