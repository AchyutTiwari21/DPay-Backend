class ApiResponse {
    constructor(statusCode, data, message = null, error = null) {
        this.statusCode = statusCode,
        this.data = data,
        this.message = message,
        this.error = error,
        this.success = statusCode < 400
    }
}

export { ApiResponse }