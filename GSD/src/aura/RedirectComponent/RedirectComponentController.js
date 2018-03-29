({
	doRedirect : function(component, event, helper) {		
        //alert('Redirecting with Id: ' + component.get("v.recordId"));       
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
