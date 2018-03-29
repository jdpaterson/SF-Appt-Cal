public class CreateAppointmentController {    
    
    public class calendarData{
        @AuraEnabled
        Lead lead {get;set;}
        @AuraEnabled
        User owner {get;set;}
        @AuraEnabled
        List<Event> events{get;set;}
    }            
    
    @AuraEnabled
    public static calendarData getData(String leadId){
        CalendarData cd = new CalendarData();
        Lead lead = [SELECT Id, FirstName, LastName, Street, City, State, PostalCode, OwnerId, Owner.FirstName, Owner.LastName, Owner.Phone, Owner.Email 
                   FROM Lead WHERE Id =: '00Q6A0000067xezUAA']; 
        cd.lead = lead;        
        User owner = [SELECT Id, FirstName, LastName, City, State, Street, PostalCode from User WHERE Id =: lead.OwnerId];        
        cd.owner = owner;
        List<Event> ownerEvents = new List<Event>([SELECT Id, StartDateTime, EndDateTime, Subject FROM Event 
                                                  WHERE OwnerId =: owner.Id]);
        cd.events = ownerEvents;
        system.debug('Lead Id: ' + lead.Id + ' | ownerId: ' + owner.Id + ' | Events Size: ' + ownerEvents.size());
        return cd;
    }
    
    @AuraEnabled
    public static List<String> getShowAsPicklist(){
        List<String> options = new List<String>();
        Schema.DescribeFieldResult fieldResult = Event.ShowAs.getDescribe();
        List<Schema.PicklistEntry> entries = fieldResult.getPicklistValues();
        for (Schema.PicklistEntry e : entries) {
            options.add(e.getLabel());
        }
		return options;
    }
    
    @AuraEnabled 
    public static List<String> getSubjectPicklist(){
        List<String> options = new List<String>();
        Schema.DescribeFieldResult fieldResult = Event.Subject.getDescribe();
        List<Schema.PicklistEntry> entries = fieldResult.getPicklistValues();
        for (Schema.PicklistEntry e : entries){
            options.add(e.getLabel());
        }
        return options;
    }
    
    @AuraEnabled 
    public static Lead getConvertLead(Lead leadRecord){
        system.debug('convertLead started');
        Database.LeadConvert lc = new Database.LeadConvert();
        lc.setLeadId(leadRecord.Id);
        
        LeadStatus convertStatus = [SELECT Id, MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1];
        lc.setConvertedStatus(convertStatus.MasterLabel);
        
        Database.DMLOptions dml = new Database.DMLOptions();
		dml.DuplicateRuleHeader.AllowSave = true;
        
        Database.LeadConvertResult lcr = Database.convertLead(lc, dml);
        system.assert(lcr.success);
        
        Lead convertedLead = [SELECT Id, ConvertedOpportunityId, ConvertedAccountId, ConvertedContactId FROM Lead WHERE Id =: leadRecord.Id];
        system.debug('Convert Lead finished, ConvertedContactId: ' + convertedLead.ConvertedContactId + ' | ConvertedOppId: ' + convertedLead.ConvertedOpportunityId);
        return convertedLead;
    }
    
    public static String genLocationString(Address a){
        String location = '';        
        if(a.getStreet() != null){location += a.getStreet() + ', ';}
        if(a.getCity() != null){location += a.getCity() + ', ';}            
        if(a.getState() != null){location += a.getState() + ', ';}
        if(a.getCountry() != null){location += a.getCountry() + ', ';}
        if(a.getPostalCode() != null){location += a.getPostalCode() + ', ';}
        return location;
    }
    @AuraEnabled
    public static Event getInsertEvent(String unixStart, String unixEnd, String showAs, String subject, String contactId, String opptId ){
        system.debug('Insert event started');
        Contact cont = [SELECT Id, MailingAddress FROM Contact WHERE Id =: contactId];
        
        String loc = '';
        if (cont.MailingAddress != null){
            loc = CreateAppointmentController.genLocationString(cont.MailingAddress);
        }
        
		Event insEvent = new Event();
        insEvent.StartDateTime = DateTime.newInstance(Long.valueOf(unixStart));
        insEvent.EndDateTime = DateTime.newInstance(Long.valueOf(unixEnd));
        insEvent.ShowAs = showAs;
        insEvent.Subject = subject;
        insEvent.WhatId = opptId;
        insEvent.WhoId = contactId;
        insEvent.Location = loc;
        
        system.debug('Start: ' + insEvent.StartDateTime);
        system.debug('End: ' + insEvent.EndDateTime);
        system.debug('ShowAs: ' + insEvent.ShowAs);
        system.debug('Subject: ' + insEvent.Subject);
        system.debug('WhatId: ' + insEvent.WhatId);
        system.debug('WhoId: ' + insEvent.WhoId);
        system.debug('Location: ' + insEvent.Location);
        system.debug('Insert event ended');
        
        insert insEvent;
        system.debug('Inserted Event Id: ' + insEvent.Id);
        return insEvent;                
    }            
}
