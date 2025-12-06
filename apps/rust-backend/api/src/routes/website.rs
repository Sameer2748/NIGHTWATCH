
use std::sync::{Arc, Mutex};
use poem::{post, Route, Server, get, handler, listener::TcpListener, EndpointExt, web::{Path, Json, Data}};

use crate::req_inputs::{CreateWebsiteRequest, SignUpUserInput,SignInUserInput};
use crate::req_outputs::{CreateWebsiteResponse,GetWebsiteResponse, SignUpUserOutput,SignInUserOutput};
use store::store::Store;

#[handler]
pub fn getwebsite(Path(id): Path<String>, Data(s): Data<&Arc<Mutex<Store>>>) -> Json<GetWebsiteResponse> {
    // store the url in the store library 
    let mut locked_s = s.lock().unwrap();
    let website = locked_s
        .get_website(id)
        .unwrap();
    Json(GetWebsiteResponse{url: website.url})

}
#[handler]
pub fn createwebsite(Json(data): Json<CreateWebsiteRequest>, Data(s): Data<&Arc<Mutex<Store>>>) -> Json<CreateWebsiteResponse> {
    let url: String = data.url;
    // store the url in the store library 
    let mut locked_s = s.lock().unwrap();
    let website = locked_s
        .create_website(String::from("dbf7faa7-f823-4887-9109-7dec0afe0f62"), url)
        .expect("Failed to persist website");

    let response: CreateWebsiteResponse = CreateWebsiteResponse {
        id: website.id
    };

    Json(response)
}
