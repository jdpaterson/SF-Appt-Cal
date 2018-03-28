({
	doInit : function(component, event, helper) {
		//window.open('/c/CreateAppointmentApp.app?leadId=' + component.get("v.recordId")); 
        console.log('Redirecting with Id: ' + component.get("v.recordId"));       
        var evt = $A.get("e.force:navigateToComponent");
        evt.setParams({
            componentDef : "c:CreateAppointment",
            componentAttributes: {
                leadId : component.get("v.recordId"),
            }
        });
        evt.fire();
		
    },
})