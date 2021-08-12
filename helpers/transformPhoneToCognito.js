// 555-555-5555 => +15555555555
export default phone => `+1${phone.replace(/-/g, '')}`;
