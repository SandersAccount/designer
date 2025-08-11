<?php
/**
 * Font List API Endpoint (PHP version)
 * 
 * Returns a list of available font files in the public/fonts directory
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $fontsDir = __DIR__ . '/../../fonts';
    
    if (!is_dir($fontsDir)) {
        throw new Exception('Fonts directory does not exist');
    }
    
    $fontFiles = [];
    $allowedExtensions = ['ttf', 'otf', 'woff', 'woff2', 'eot'];
    
    $files = scandir($fontsDir);
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        $filePath = $fontsDir . '/' . $file;
        
        if (is_file($filePath)) {
            $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            
            if (in_array($extension, $allowedExtensions)) {
                $fontFiles[] = $file;
            }
        }
    }
    
    // Sort the files for consistent output
    sort($fontFiles);
    
    echo json_encode($fontFiles);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
