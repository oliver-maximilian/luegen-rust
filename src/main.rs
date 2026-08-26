mod api;
mod api_model;
mod game;
mod model;
use clap::Parser;

#[derive(Parser)]
#[command(name = "luegen-rust")]
struct Args {
    /// Debug-Endpoint (/api/debug/game) aktivieren
    #[arg(long)]
    debug: bool,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    if !args.debug {
        println!(
            "Lügen Webserver ohne Debug funktion gestartet.\nFür Debug die .exe mit --debug ausführen"
        )
    } else {
        println!("Lügen Webserver mit Debug funktion gestartet")
    }

    let server_handle = tokio::spawn(api::start_server(args.debug)); // Task Handle erstellen, um darauf warten zu können

    server_handle.await.unwrap(); // warten auf das ende von der API (sollte nur beim crash oder so passieren)
}
