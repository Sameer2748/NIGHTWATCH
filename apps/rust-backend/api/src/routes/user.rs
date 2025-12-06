use std::sync::{Arc, Mutex};
use poem::{ error::ResponseError, Error,  handler,Result, http::StatusCode, web::{Data, Json}};

use crate::req_inputs::{ SignUpUserInput,SignInUserInput};
use crate::req_outputs::{ SignUpUserOutput,SignInUserOutput};
use store::{ store::Store};


#[derive(Debug, thiserror::Error)]
#[error("{message}")]
struct CustomError {
    message: String,
}

impl ResponseError for CustomError {
    fn status(&self) -> StatusCode {
        StatusCode::BAD_REQUEST
    }
}

#[handler]
pub fn signupuser(Json(data): Json<SignUpUserInput>,  Data(s): Data<&Arc<Mutex<Store>>>) -> Result<Json<SignUpUserOutput>, Error>{
    let name = data.name;
    let password = data.password;
    let mut locked_s = s.lock().unwrap();
    let id = locked_s
        .signup_user(name, password).map_err(|_| Error::from_status(StatusCode::CONFLICT))?; 

    let response = SignUpUserOutput{
        id: id
    };
    Ok(Json(response))
}
#[handler]
pub fn signinuser(Json(data): Json<SignInUserInput>,  Data(s): Data<&Arc<Mutex<Store>>>) -> Result<Json<SignInUserOutput>, Error>{
    let name = data.name;
    let password = data.password;
    let mut locked_s = s.lock().unwrap();
    let id = locked_s.signin_user(name.clone(), password);

    match id {
        Ok(id) => {
            let response = SignInUserOutput{
                jwt: id
            };

            Ok(Json(response))
        }
        Err(_) => Err(CustomError {
            message: "Invalid username or password".to_string(),
        }
        .into())
    }
   

}
