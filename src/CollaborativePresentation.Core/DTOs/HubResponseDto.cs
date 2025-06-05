namespace CollaborativePresentation.Core.DTOs;
public class HubResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    
    public static HubResponse<T> CreateSuccess(T data, string? message = null)
    {
        return new HubResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }
    
    public static HubResponse<T> CreateError(string message)
    {
        return new HubResponse<T>
        {
            Success = false,
            Message = message
        };
    }
}
public class ConnectionInfoDto
{
    public string ConnectionId { get; set; } = string.Empty;
    public Guid PresentationId { get; set; }
    public ActiveUserDto User { get; set; } = null!;
}