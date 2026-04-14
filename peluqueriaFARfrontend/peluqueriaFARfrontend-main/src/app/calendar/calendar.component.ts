import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  standalone: false
})
export class CalendarComponent implements AfterViewInit {
  @ViewChild('calendarRef') calendarRef!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    const calendar = new Calendar(this.calendarRef.nativeElement, {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek,dayGridDay'
      },
      events: [
        { title: 'Cita: Corte de cabello', date: '2026-03-20' },
        { title: 'Cita: Tinte', date: '2026-03-24' }
      ]
    });

    calendar.render();
  }
}
