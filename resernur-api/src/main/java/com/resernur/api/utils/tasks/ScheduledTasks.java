package com.resernur.api.utils.tasks;

import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.bookings.BookingRequest;
import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.models.places.Place;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.repositories.bookings.BookingRequestRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScheduledTasks {

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private NotificationService notificationService;

    @Scheduled(fixedRate = (1000 * 60))
    public void changePlacesStatusToAvailable(){
        List<Place> placesWithPastBookings = placeRepository.findAllPlacesWithPastBookings();
        for(Place place : placesWithPastBookings){
            place.setStatus(PlaceStatus.AVAILABLE);
        }
        placeRepository.saveAll(placesWithPastBookings);
    }

    @Scheduled(fixedRate = (1000 * 60))
    public void changePastBookingsStatusToPast(){
        List<Booking> bookingsToUpdate = bookingRepository.findCompletedPastBookings();
        for(Booking booking : bookingsToUpdate){
            booking.setStatus(com.resernur.api.models.enums.BookingStatus.PAST);
        }
        bookingRepository.saveAll(bookingsToUpdate);
    }

    @Scheduled(fixedRate = (1000 * 60))
    public void changeUnrespondedBookingRequestAndNotify(){
        List<BookingRequest> expiredRequests = bookingRequestRepository.findExpireRequests();
        for(BookingRequest br : expiredRequests){
            br.setStatus(com.resernur.api.models.enums.BookingRequestStatus.REJECTED);
            notificationService.createNotification(br.getUser().getId(), "Tu solicitud de reserva para el lugar " + br.getPlace().getName() + " ha sido automaticamente rechazada, pues el periodo solicitado ya pasó.");
        }
        bookingRequestRepository.saveAll(expiredRequests);
    }

}
