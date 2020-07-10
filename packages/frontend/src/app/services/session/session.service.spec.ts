// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {TestBed} from '@angular/core/testing';
import {SessionService} from './session.service';
import {of, throwError} from 'rxjs';
import {SessionStatus} from '../search/interfaces';
import {COMService} from '../com/com.service';
import {catchError} from 'rxjs/operators';

describe('SessionService', () => {
  let service: SessionService;
  const sessionStatus: SessionStatus = {
    permitted: false,
    expiration: new Date(),
  };

  const mockCOMService = {};

  const getFutureDate = (yearsAhead: number): Date => {
    return new Date(Date.now() + new Date(yearsAhead).getTime());
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{provide: COMService, useValue: mockCOMService}],
    });
    service = TestBed.inject(SessionService);
    mockCOMService['fetchSessionStatus'] = () => of(sessionStatus);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('update', () => {
    it('should update the status with the new session status', done => {
      sessionStatus.permitted = true;
      sessionStatus.expiration = getFutureDate(1);

      service.update().subscribe(() => {
        expect(service.status.permitted).toEqual(sessionStatus.permitted);
        expect(service.status.expiration).toEqual(sessionStatus.expiration);
        done();
      });
    });

    it("should not update the status if the session hasn't expired", done => {
      service.status.permitted = true;
      service.status.expiration = getFutureDate(1);

      // save status
      const expectedLogginStatus = service.status.permitted;
      const expectedexpirationDate = service.status.expiration;

      // set new status (should not be updated)
      sessionStatus.permitted = !service.status.permitted;
      sessionStatus.expiration = getFutureDate(2);

      service.update().subscribe(() => {
        expect(service.status.permitted).toEqual(expectedLogginStatus);
        expect(service.status.expiration).toEqual(expectedexpirationDate);
        done();
      });
    });

    it('should save the current session status if an error occurs and reject a promise', done => {
      const expectedLogginStatus = true;
      const expectedexpirationDate = new Date(1900, 4);

      service.status.permitted = expectedLogginStatus;
      service.status.expiration = expectedexpirationDate;

      mockCOMService['fetchSessionStatus'] = () => throwError('');

      service
        .update()
        .pipe(
          catchError(() => {
            expect(service.status.permitted).toEqual(expectedLogginStatus);
            expect(service.status.expiration).toEqual(expectedexpirationDate);
            done();
            return of();
          })
        )
        .subscribe(() => {
          fail();
        });
    });
  });
});
