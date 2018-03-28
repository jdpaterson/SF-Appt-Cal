@isTest
public class TEST_CreateAppointmentController {

    @testSetup
    static void insertData(){
        List<Lead> leads = new List<Lead>();
        List<Event> events = new List<Event>();
        for (Integer i = 0; i < 10; i++){
            Lead l = new Lead();
            l.FirstName = String.valueOf(i) + ' first';
            l.LastName = String.valueOf(i) + ' last';
            l.phone = '1234567890';
            l.Status = 'Open - Not Contacted';
            l.Company = String.valueOf(i) + ' company';
            l.City = 'Acapulco';
            leads.add(l);
            
            Event e = new Event();
            e.StartDateTime = DateTime.now();
            e.EndDateTime = e.StartDateTime.AddHours(1);
            e.Subject = String.valueOf(i) + ' subject';            
            events.add(e);                        
        }
        insert leads;
        insert events;
        
        
    }
    
    static testMethod void test1(){
        test.startTest();
        Lead l = [SELECT Id FROM Lead LIMIT 1];
        Event e = [SELECT Id, StartDateTime, EndDateTime, ShowAs, Subject FROM Event LIMIT 1];
        CreateAppointmentController.getData(String.valueOf(l.Id));
        CreateAppointmentController.getShowAsPicklist();
        CreateAppointmentController.getSubjectPicklist();
        l = CreateAppointmentController.getConvertLead(l);
        system.debug(l.ConvertedOpportunityId);
        CreateAppointmentController.getInsertEvent(String.valueOf(e.StartDateTime.getTime()), String.valueOf(e.EndDateTime.getTime()), 
                                                   e.showAs, e.subject, l.ConvertedContactId, l.ConvertedOpportunityId);
        
    }
}