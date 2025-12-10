use std::sync::{Arc, Mutex};
use poem::{post, Route, Server, get, listener::TcpListener, EndpointExt};

use crate::routes::user::{signupuser, signinuser};
use crate::routes::website::{getwebsite, createwebsite};
use store::store::Store;

pub mod req_inputs;
pub mod req_outputs;
pub mod routes;
pub mod auth_middleware;

// flabor - multi-thread run the program in multithreading and current_thread will run it like javaascript single threadly 
#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), std::io::Error> {
    // sindle instance of db connection  and pass it to app so evey route cna use one connection but different vairant will be created for every thread so wont run connection limit 
    let s = Arc::new(Mutex::new(Store::default().unwrap()));
    let app = Route::new()
    .at("/website/:websiteId", get(getwebsite))
    .at("/website", post(createwebsite))
    .at("/user/signup", post(signupuser))
    .at("/user/signin", post(signinuser))
    .data(s);

    Server::new(TcpListener::bind("0.0.0.0:3002"))
        .run(app)
        .await
}