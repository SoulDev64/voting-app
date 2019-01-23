import * as passport from 'passport';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {

  constructor(private router: Router,
              private route: ActivatedRoute,
              private auth: AuthService,
              private toastr: ToastsManager) { }

  ngOnInit() {
    const confirm = this.route.params.subscribe(params => {
      const hash = params['hash'];
      this.auth.chekToken({hash}).subscribe(() => {
        this.router.navigate(['/polls']);
      }, (error) => {
        this.toastr.error(error);
      });
    });
  }

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

}
