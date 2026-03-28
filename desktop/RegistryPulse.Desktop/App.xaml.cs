namespace RegistryPulse.Desktop;

public partial class App : Application
{
    private readonly IServiceProvider _services;

    public App(IServiceProvider services)
    {
        InitializeComponent();
        _services = services;
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        var mainPage = _services.GetRequiredService<MainPage>();
        var window = new Window(mainPage)
        {
            Title = "Registry Pulse",
            Width = 1280,
            Height = 800,
            MinimumWidth = 800,
            MinimumHeight = 600
        };

        window.Destroying += (_, _) =>
        {
            mainPage.Dispose();
        };

        return window;
    }
}
