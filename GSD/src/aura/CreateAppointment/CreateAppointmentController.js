({      
    afterScriptsLoaded : function(component,event,helper){
        helper.fetchData(component, event, helper);
        helper.popTimePicklists(component, event, helper);
        helper.popSubjectPicklist(component, event, helper);
        helper.popShowAsPicklist(component, event, helper);     
        
    },
    saveEvent: function(component, event, helper){        
        if (component.get("v.eventSaved") == false){            
            var saveEvent = new Object({title: "New Event"});
            saveEvent = helper.updateJSEvent(saveEvent, component.get("v.newJSEvent"));			
            $('#calendar').fullCalendar('renderEvent', saveEvent, 'stick');
            component.set("v.eventSaved", true);
        }else{
            var updEvent = helper.updateJSEvent(component.get("v.calEvent"), component.get("v.newJSEvent"));
            console.log('after update, event start will be: ' + updEvent.start.format() );
			var updSFEvent = helper.updateSFEvent(component, updEvent);
            console.log('after further update, sfEvent start will be: ' + updSFEvent.start.format());
            component.set("v.newJSEvent", updSFEvent);
            $('#calendar').fullCalendar('updateEvent', updEvent);
        }
        component.set("v.isNewEvent", false);
    },        
    exitModal: function(component, event, helper){
        component.set("v.isNewEvent", false);
    },
    saveAppointment: function(component, event, helper){
		console.log('Save Appointment clicked');        
        var eventToSave = component.get("v.newJSEvent");
        if(eventToSave == undefined){
            return alert('Please add an appointment');
        }        
        if(helper.isBusinessHours(eventToSave) == false){
            return alert('The appointment is outside of business hours, reschedule and try again');
        }
        if (helper.isDoubleBooked(eventToSave, component.get("v.events")) == true){
            var proceed = confirm('This time is now double booked, are you sure you want to proceed?');
        }
		
        if (proceed){
        	console.log('Proceeding with lead conversion');    
            helper.convertLead(component,event,helper);                                         
        }
        
        
    },
    
})