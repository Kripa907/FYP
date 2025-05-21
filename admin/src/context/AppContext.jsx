import { createContext } from "react";

export const AppContext = createContext();

const AppContextProvider = (props) => {
    // Format date for display
    const slotDateFormat = (dateString) => {
        if (!dateString) {
            console.log("slotDateFormat received empty string");
            return '';
        }
        let date = new Date(dateString);

        // If initial parsing fails, try splitting and reassembling for DD_MM_YYYY format
        if (isNaN(date.getTime())) {
            const parts = dateString.split('_');
            if (parts.length === 3) {
                // Assuming DD_MM_YYYY format, reassemble as YYYY-MM-DD for better parsing
                const reassembled = `${parts[2]}-${parts[1]}-${parts[0]}`;
                console.log(`slotDateFormat: trying to parse ${dateString} as DD_MM_YYYY, reassembled: ${reassembled}`);
                date = new Date(reassembled);
            }
        }

        if (isNaN(date.getTime())) {
            console.log(`slotDateFormat failed to parse dateString: ${dateString}`);
            return 'Invalid Date'; // Or return '' or a placeholder
        }

        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Format time for display (ensure AM/PM)
    const slotTimeFormat = (timeString) => {
        if (!timeString) return '';
        // Assuming timeString is in HH:MM or HH:MM AM/PM format
        // This is a basic attempt; more complex parsing might be needed
        try {
            // Create a dummy date to parse the time correctly
            const [time, period] = timeString.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (period && period.toLowerCase() === 'pm' && hours < 12) {
                hours += 12;
            } else if (period && period.toLowerCase() === 'am' && hours === 12) {
                hours = 0; // Midnight
            }

            const date = new Date();
            date.setHours(hours, minutes, 0, 0);

            // Format back to HH:MM AM/PM
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
        } catch (error) {
            console.error('Error formatting time:', timeString, error);
            return timeString; // Return original if formatting fails
        }
    };

    // Calculate age from date of birth
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    };

    // Currency symbol
    const currency = 'NPR ';

    const value = {
        slotDateFormat,
        slotTimeFormat,
        calculateAge,
        currency
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;